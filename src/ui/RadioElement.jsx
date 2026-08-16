import styled from "styled-components";

export const RadioGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

export const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 2rem;
  font-size: 1.4rem;
  cursor: pointer;
`;

export const Radio = styled.input`
  width: 1.8rem;
  height: 1.8rem;
  accent-color: var(--color-brand-600);
  cursor: pointer;
`;
