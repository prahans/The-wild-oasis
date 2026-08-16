import Button from "../../ui/Button";
import { useCheckout } from "./useCheckout";

function CheckoutButton({ bookingId }) {
  const { isCheckingOut, checkout } = useCheckout();
  return (
    <Button
      size="small"
      variation="primary"
      disabled={isCheckingOut}
      onClick={() => checkout(bookingId)}
    >
      Check out
    </Button>
  );
}

export default CheckoutButton;
