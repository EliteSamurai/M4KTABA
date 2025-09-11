import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SavedAddressPicker } from "@/components/SavedAddressPicker";

describe("SavedAddressPicker", () => {
  it("renders and selects address", () => {
    const addresses = [
      {
        id: "1",
        name: "Home",
        street1: "1 Main",
        city: "NY",
        state: "NY",
        zip: "10001",
        country: "US",
      },
      {
        id: "2",
        name: "Work",
        street1: "2 Second",
        city: "SF",
        state: "CA",
        zip: "94105",
        country: "US",
      },
    ];
    const onUse = jest.fn();
    render(<SavedAddressPicker addresses={addresses} onUse={onUse} />);
    fireEvent.click(screen.getByText("Use this address"));
    expect(onUse).toHaveBeenCalled();
  });
});
