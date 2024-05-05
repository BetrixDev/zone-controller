import { atom } from "jotai";

export const isAddBoardDialogOpenAtom = atom(false);

export const addZoneDialogBoardIdAtom = atom<string | undefined>(undefined);

export const deleteZoneDialogIdAtom = atom<string | undefined>(undefined);

export const deleteBoardDialogIdAtom = atom<string | undefined>(undefined);

export const isCreatePresetDialogOpenAtom = atom(false);

export const deletePresetDialogIdAtom = atom<string | undefined>(undefined);
