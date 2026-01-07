import { format } from "date-fns";

export function toYMD(d: Date): string {
    return format(d, "yyyy-MM-dd");
}
