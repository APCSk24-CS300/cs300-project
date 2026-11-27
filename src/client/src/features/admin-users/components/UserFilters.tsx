import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import { ROLE_CODES, ROLE_LABEL, type RoleCode } from "@/libs/roles";

type UserFiltersProps = {
  search: string;
  role: RoleCode | "";
  onSearchChange: (value: string) => void;
  onRoleChange: (value: RoleCode | "") => void;
};

export function UserFilters({ search, role, onSearchChange, onRoleChange }: UserFiltersProps) {
  return (
    <div role="search" className="grid gap-4 sm:grid-cols-[2fr_1fr]">
      <FormField label="Search" hint="Name, email or student number">
        <TextInput type="search" value={search} onChange={(e) => onSearchChange(e.target.value)} />
      </FormField>
      <FormField label="Role">
        <Select
          value={role}
          onChange={(e) => onRoleChange((e.target.value as RoleCode) || "")}
          placeholder="All roles"
          options={ROLE_CODES.map((code) => ({ value: code, label: ROLE_LABEL[code] }))}
        />
      </FormField>
    </div>
  );
}
