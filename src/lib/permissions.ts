// ==============================================================================
// CARVLAK GROUP - SISTEMA DE PERMISOS & ROLES
// ==============================================================================

import { Profile, Role, Business } from '../types';

export function isAdmin(profile: Profile | null): boolean {
  if (!profile || !profile.is_active) return false;
  return profile.roles.includes('admin');
}

export function isEncargado(profile: Profile | null): boolean {
  if (!profile || !profile.is_active) return false;
  return profile.roles.includes('admin') || profile.roles.includes('encargado');
}

export function hasRole(profile: Profile | null, role: Role): boolean {
  if (!profile || !profile.is_active) return false;
  if (profile.roles.includes('admin')) return true;
  return profile.roles.includes(role);
}

export function canAccessBusiness(profile: Profile | null, business: Business): boolean {
  if (!profile || !profile.is_active) return false;
  if (profile.roles.includes('admin') || profile.roles.includes('encargado')) return true;
  return profile.businesses.includes(business);
}

/**
 * Solo el Administrador (Maximiliano) puede ver y editar comisiones de empleados
 */
export function canViewCommissions(profile: Profile | null): boolean {
  return isAdmin(profile);
}

/**
 * Solo Admin y Encargado pueden asignar tareas y turnos a terceros
 */
export function canAssignTasks(profile: Profile | null): boolean {
  return isEncargado(profile);
}

/**
 * Solo Admin y Encargado pueden archivar clientes o vehículos
 */
export function canArchiveRecords(profile: Profile | null): boolean {
  return isEncargado(profile);
}
