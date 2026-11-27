import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { render, screen } from "../../../tests/test-utils";

const columns = [{ key: "n", header: "Name", cell: (r: { n: string }) => r.n }];

describe("DataTable", () => {
  it("renders a captioned semantic table", () => {
    render(<DataTable caption="People" columns={columns} rows={[{ n: "A" }]} rowKey={(r) => r.n} />);
    expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "A" })).toBeInTheDocument();
  });

  it("shows loading, empty and error slots", () => {
    const { rerender } = render(<DataTable caption="P" columns={columns} rows={[]} rowKey={(r) => r.n} loading />);
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    rerender(<DataTable caption="P" columns={columns} rows={[]} rowKey={(r) => r.n} empty={<p>Nothing</p>} />);
    expect(screen.getByText("Nothing")).toBeInTheDocument();
    rerender(<DataTable caption="P" columns={columns} rows={[]} rowKey={(r) => r.n} error={<p>Broken</p>} />);
    expect(screen.getByText("Broken")).toBeInTheDocument();
  });
});

describe("Pagination", () => {
  it("disables the ends and reports the page", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} />);
    expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveTextContent("Page 1 of 3");
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
