import { useQuery } from "@tanstack/react-query";
import { getAvailableCabins } from "../../services/apiBookings";

export function useAvailableCabins(startDate, endDate, numGuests) {
  const {
    data: availableCabins,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["availableCabins", startDate, endDate, numGuests],
    queryFn: () => getAvailableCabins(startDate, endDate, numGuests),
    enabled: !!startDate && !!endDate,
  });

  return { availableCabins, isLoading, error };
}
