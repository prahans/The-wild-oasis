import FormRow from "../../ui/FormRow";
import Input from "../../ui/Input";
import Form from "../../ui/Form";
import Button from "../../ui/Button";
import { Radio, RadioGroup, RadioOption } from "../../ui/RadioElement";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import SelectElement from "../../ui/SelectElement";
import Spinner from "../../ui/Spinner";
import { useGuests } from "./useGuests";
import { useAvailableCabins } from "./useAvailableCabins";
import { useDebounce } from "../../hooks/useDebounce";

import { Controller, useForm } from "react-hook-form";
import { addDays } from "date-fns";
import { useCreateBooking } from "./useCreateBooking";

const defaultStartDate = new Date();
const defaultEndDate = addDays(new Date(), 2);

function CreateBookingForm({ onCloseModal }) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      guestId: "",
      numGuests: 1,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      cabinId: "",
      hasBreakfast: "false",
      isPaid: "false",
    },
  });

  // Watch form values
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const numGuests = watch("numGuests");

  const { guests, isLoading: isLoadingGuests } = useGuests();
  const { createNewBooking, isCreating } = useCreateBooking();

  const { availableCabins, isLoading: isLoadingCabins } = useAvailableCabins(
    useDebounce(startDate, 500),
    useDebounce(endDate, 500),
    useDebounce(numGuests, 500),
  );

  const isWorking = isLoadingGuests || isLoadingCabins || isCreating;

  if (isWorking) return <Spinner />;

  function onSubmit(data) {
    createNewBooking(data, {
      onSuccess: () => {
        reset();
        onCloseModal?.();
      },
    });
  }

  return (
    <Form
      type={onCloseModal ? "modal" : "regular"}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormRow label="Select Existing Guest">
        <SelectElement
          {...register("guestId", {
            required: "This field is required",
          })}
        >
          <option value="">Select guest</option>

          {guests?.map((guest) => (
            <option key={guest.id} value={guest.id}>
              {guest.fullName}
            </option>
          ))}
        </SelectElement>
      </FormRow>

      <FormRow label="Number of Guests">
        <Input
          type="number"
          min="1"
          max="10"
          {...register("numGuests", {
            required: "This field is required",
            valueAsNumber: true,
            min: 1,
            max: 10,
          })}
        />
      </FormRow>

      <FormRow label="Start date">
        <Controller
          name="startDate"
          control={control}
          rules={{ required: "This field is required" }}
          render={({ field }) => (
            <DatePicker
              selected={field.value}
              onChange={field.onChange}
              customInput={<Input />}
            />
          )}
        />
      </FormRow>

      <FormRow label="End date">
        <Controller
          name="endDate"
          control={control}
          rules={{ required: "This field is required" }}
          render={({ field }) => (
            <DatePicker
              selected={field.value}
              onChange={field.onChange}
              customInput={<Input />}
            />
          )}
        />
      </FormRow>

      <FormRow label="Cabin">
        <SelectElement
          {...register("cabinId", {
            required: "This field is required",
          })}
        >
          <option value="">Select cabin</option>

          {availableCabins?.map((cabin) => (
            <option key={cabin.id} value={cabin.id}>
              {cabin.name}
            </option>
          ))}
        </SelectElement>
      </FormRow>

      <FormRow label="Breakfast included">
        <RadioGroup>
          <RadioOption>
            <Radio type="radio" value="true" {...register("hasBreakfast")} />
            Yes
          </RadioOption>

          <RadioOption>
            <Radio type="radio" value="false" {...register("hasBreakfast")} />
            No
          </RadioOption>
        </RadioGroup>
      </FormRow>

      <FormRow label="Payment confirmed">
        <RadioGroup>
          <RadioOption>
            <Radio type="radio" value="true" {...register("isPaid")} />
            Yes
          </RadioOption>

          <RadioOption>
            <Radio type="radio" value="false" {...register("isPaid")} />
            No
          </RadioOption>
        </RadioGroup>
      </FormRow>

      <FormRow>
        <Button
          variation="secondary"
          type="reset"
          onClick={() => {
            reset();
            onCloseModal?.();
          }}
        >
          Cancel
        </Button>

        <Button disabled={isWorking}>Create new booking</Button>
      </FormRow>
    </Form>
  );
}

export default CreateBookingForm;
