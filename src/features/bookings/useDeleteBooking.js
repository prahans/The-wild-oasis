import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBooking } from "../../services/apiBookings";
import toast from "react-hot-toast";

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  const { isLoading: isDeletingBooking, mutate: deleteTheBooking } =
    useMutation({
      mutationFn: deleteBooking,
      onSuccess: () => {
        toast.success("booking successfully deleted");
        queryClient.invalidateQueries({
          queryKey: ["bookings"],
        });
      },
      onError: (err) => toast.error(err.message),
    });

  return { isDeletingBooking, deleteTheBooking };
}
