import { apiFetch } from './api';

export interface EquipmentItem {
  id: number;
  name: string;
  category: string;
  is_bodyweight: boolean;
}

export interface EquipmentCatalogGroup {
  category: string;
  items: EquipmentItem[];
}

/** Fetch the full equipment catalog grouped by category. */
export async function getEquipmentCatalog(): Promise<EquipmentCatalogGroup[]> {
  const { ok, body } = await apiFetch<EquipmentCatalogGroup[]>('/api/equipment/');
  if (!ok) throw new Error('Failed to load equipment catalog');
  return body;
}

/** Fetch the current user's saved equipment selection. */
export async function getMyEquipment(): Promise<EquipmentItem[]> {
  const { ok, body } = await apiFetch<EquipmentItem[]>('/api/equipment/mine');
  if (!ok) throw new Error('Failed to load your equipment');
  return body;
}

/** Replace the user's equipment selection with the given IDs. */
export async function updateMyEquipment(equipmentIds: number[]): Promise<EquipmentItem[]> {
  const { ok, body } = await apiFetch<EquipmentItem[]>('/api/equipment/mine', {
    method: 'PUT',
    body: JSON.stringify({ equipment_ids: equipmentIds }),
  });
  if (!ok) throw new Error('Failed to save equipment');
  return body;
}
