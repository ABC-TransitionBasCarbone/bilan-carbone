import { render, screen } from "@testing-library/react";
import Hello from "@/components/Hello";

describe("Hello component", () => {
  it("renders 'Hello World'", () => {
    render(<Hello />);
    const helloElement = screen.getByText("Hello World");
    expect(helloElement).toBeInTheDocument();
  });
});
