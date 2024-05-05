import { atom } from "jotai";

export const isAddZoneBoardDialogOpenAtom = atom(false);

export const deleteZoneDialogIdAtom = atom<string | undefined>(undefined);

export const isCreatePresetDialogOpenAtom = atom(false);

export const deletePresetDialogIdAtom = atom<string | undefined>(undefined);
