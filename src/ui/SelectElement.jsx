import styled from "styled-components";

const SelectElement = styled.select`
  border: 1px solid var(--color-grey-300);
  background-color: var(--color-grey-0);
  border-radius: var(--border-radius-sm);
  padding: 0.8rem 1.2rem;
  box-shadow: var(--shadow-sm);
  font: inherit;
  color: inherit;

  &:focus {
    outline: none;
    border-color: var(--color-brand-600);
  }
`;

export default SelectElement;
