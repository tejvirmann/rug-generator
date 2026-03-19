import type { RugSpec } from "@/lib/types";
import { saroukDefaults } from "./sarouk";
import { herizDefaults } from "./heriz";
import { kashanDefaults } from "./kashan";
import { tabrizDefaults } from "./tabriz";

export const STYLE_PRESETS: Record<string, Partial<RugSpec>> = {
  sarouk: saroukDefaults,
  heriz: herizDefaults,
  kashan: kashanDefaults,
  tabriz: tabrizDefaults,
};

export const STYLE_LABELS: Record<string, string> = {
  sarouk: "Antique Sarouk",
  heriz: "Heriz Geometric",
  kashan: "Kashan Floral",
  tabriz: "Tabriz Classic",
  custom: "Custom",
};
