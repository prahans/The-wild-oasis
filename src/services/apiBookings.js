import { PAGE_SIZE } from "../utils/constants";
import { getToday } from "../utils/helpers";
import supabase from "./supabase";
import { differenceInDays } from "date-fns";

export async function getBookings({ filter, sortBy, page }) {
  let query = supabase
    .from("bookings")
    .select(
      "id, created_at, startDate, endDate, numNights, numGuests, status, totalPrice, cabins(name), guests(fullName, email)",
      { count: "exact" },
    );

  // filter
  if (filter) query = query[filter.method || "eq"](filter.field, filter.value);

  // sort
  if (sortBy)
    query = query.order(sortBy.field, {
      ascending: sortBy.direction === "asc",
    });

  if (page) {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    console.log(error);
    throw new error("Bookings could not be loaded");
  }

  return { data, count };
}

export async function getBooking(id) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, cabins(*), guests(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    throw new Error("Booking not found");
  }

  return data;
}

// Returns all BOOKINGS that are were created after the given date. Useful to get bookings created in the last 30 days, for example.
// data: ISOString
export async function getBookingsAfterDate(date) {
  const { data, error } = await supabase
    .from("bookings")
    .select("created_at, totalPrice, extrasPrice")
    .gte("created_at", date)
    .lte("created_at", getToday({ end: true }));

  if (error) {
    console.error(error);
    throw new Error("Bookings could not get loaded");
  }

  return data;
}

// Returns all STAYS that are were created after the given date
export async function getStaysAfterDate(date) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, guests(fullName)")
    .gte("startDate", date)
    .lte("startDate", getToday());

  if (error) {
    console.error(error);
    throw new Error("Bookings could not get loaded");
  }

  return data;
}

// Activity means that there is a check in or a check out today
export async function getStaysTodayActivity() {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, guests(fullName, nationality, countryFlag)")
    .or(
      `and(status.eq.unconfirmed,startDate.eq.${getToday()}),and(status.eq.checked-in,endDate.eq.${getToday()})`,
    )
    .order("created_at");

  // Equivalent to this. But by querying this, we only download the data we actually need, otherwise we would need ALL bookings ever created
  // (stay.status === 'unconfirmed' && isToday(new Date(stay.startDate))) ||
  // (stay.status === 'checked-in' && isToday(new Date(stay.endDate)))

  if (error) {
    console.error(error);
    throw new Error("Bookings could not get loaded");
  }
  return data;
}

export async function updateBooking(id, obj) {
  const { data, error } = await supabase
    .from("bookings")
    .update(obj)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Booking could not be updated");
  }
  return data;
}

export async function deleteBooking(id) {
  // REMEMBER RLS POLICIES
  const { data, error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    console.error(error);
    throw new Error("Booking could not be deleted");
  }
  return data;
}

export async function getAvailableCabins(startDate, endDate, numGuests) {
  // removing timeStamp from  startDate and endDate in this formate Convert dates to YYYY-MM-DD
  const start =
    startDate instanceof Date ? startDate.toISOString().split("T")[0] : "";

  const end =
    endDate instanceof Date ? endDate.toISOString().split("T")[0] : "";

  const { data: cabins, error: cabinsError } = await supabase
    .from("cabins")
    .select("*");

  if (cabinsError) throw new Error("Cabins could not be loaded");

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("cabinId")
    .lt("startDate", end)
    .gt("endDate", start);

  if (bookingsError) throw new Error("Bookings could not be loaded");

  const unavailableCabinIds = bookings.map((booking) => booking.cabinId);

  return cabins.filter(
    (cabin) =>
      !unavailableCabinIds.includes(cabin.id) && cabin.maxCapacity >= numGuests,
  );
}

// create new booking

export async function createBooking({
  cabinId,
  guestId,
  endDate,
  startDate,
  isPaid,
  numGuests,
  hasBreakfast,
  observations,
}) {
  try {
    // removing timeStamp from  startDate and endDate in this formate Convert dates to YYYY-MM-DD
    const start =
      startDate instanceof Date ? startDate.toISOString().split("T")[0] : "";

    const end =
      endDate instanceof Date ? endDate.toISOString().split("T")[0] : "";

    // calculating number of nights
    const numNights = differenceInDays(new Date(end), new Date(start));

    // Get the selected cabin to obtain its price and discount & get the price of breakfast from settings
    const [
      { data: cabin, error: cabinError },
      { data: settings, error: settingsError },
    ] = await Promise.all([
      supabase
        .from("cabins")
        .select("regularPrice, discount")
        .eq("id", cabinId)
        .single(),

      supabase.from("settings").select("breakfastPrice").single(),
    ]);

    if (cabinError || settingsError) {
      console.error(cabinError || settingsError);

      throw new Error(
        cabinError
          ? "Cabin could not be loaded"
          : "Settings could not be loaded",
      );
    }

    const cabinPrice = (cabin.regularPrice - cabin.discount) * numNights;

    // extrasPrice should be 0 if hasBreakfast is false
    const extrasPrice =
      hasBreakfast === "true"
        ? settings.breakfastPrice * numGuests * numNights
        : 0;

    const bookingToInsert = {
      guestId: guestId,
      cabinId: cabinId,

      startDate: start,
      endDate: end,

      numNights,

      numGuests,

      cabinPrice,
      extrasPrice,
      totalPrice: cabinPrice + extrasPrice,

      hasBreakfast,
      isPaid,

      status: "unconfirmed",

      observations: observations || "",
    };

    const { data, error } = await supabase
      .from("bookings")
      .insert([bookingToInsert])
      .select()
      .single();

    if (error) {
      console.error(error);
      throw new Error("Booking could not be created");
    }

    return data;
  } catch (error) {
    console.error(error);
    throw new Error("Booking could not be created");
  }
}
