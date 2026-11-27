import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import { ROLE_CODES, ROLE_LABEL, type RoleCode } from "@/libs/roles";

type UserFiltersProps = {
  search: string;
  role: RoleCode | "";
  onSearchChange: (value: string) => void;
  onRoleChange: (value: RoleCode | "") => void;
  onClear?: () => void;
};

export function UserFilters({ search, role, onSearchChange, onRoleChange, onClear }: UserFiltersProps) {
  const hasFilters = Boolean(search || role);

  return (
    <div
      role="search"
      className="flex flex-col gap-4 rounded-2xl border border-divider bg-surface p-4 shadow-xs sm:flex-row sm:items-end"
    >
      <div className="grid flex-1 gap-4 sm:grid-cols-[2fr_1fr]">
        <FormField label="Search" hideRequirementBadge hint="Name, email or student number">
          <TextInput
            type="search"
            placeholder="Search accounts…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </FormField>
        <FormField label="Role" hideRequirementBadge>
          <Select
            value={role}
            onChange={(e) => onRoleChange((e.target.value as RoleCode) || "")}
            placeholder="All roles"
            options={ROLE_CODES.map((code) => ({ value: code, label: ROLE_LABEL[code] }))}
          />
        </FormField>
      </div>
      {hasFilters && onClear ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="shrink-0 self-start border border-divider sm:mb-6 sm:self-auto"
        >
          Reset
        </Button>
      ) : null}
    </div>
  );
}
