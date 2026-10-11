// ==============================================================================
// SUPABASE EDGE FUNCTION: sync-tiendanube
// Sincronización oficial de inventario CARVLAK con Tiendanube API
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface SyncPayload {
  action: 'publish' | 'update_price' | 'reserve' | 'sell' | 'sync';
  vehicle: {
    id: string;
    tiendanube_id?: string;
    brand: string;
    model: string;
    version?: string;
    year: number;
    mileage: number;
    sale_price: number;
    sale_currency?: string;
    status: string;
    catalog_description?: string;
    images?: string[];
    cover_image?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('TIENDANUBE_ACCESS_TOKEN');
    const storeId = Deno.env.get('TIENDANUBE_USER_ID') || Deno.env.get('TIENDANUBE_STORE_ID');

    const body: SyncPayload = await req.json();
    const { action, vehicle } = body;

    if (!vehicle || !vehicle.id) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'error',
          error: 'Vehículo inválido o sin ID'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validación de credenciales en Supabase Secrets
    if (!accessToken || !storeId) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'error',
          error: 'Credenciales de Tiendanube no configuradas en Supabase Secrets (TIENDANUBE_ACCESS_TOKEN, TIENDANUBE_USER_ID)',
          vehicleId: vehicle.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const tiendanubeApiBase = `https://api.tiendanube.com/v1/${storeId}`;

    // Payload higienizado: NUNCA incluye costos, márgenes, notas internas ni precio mínimo
    const productData = {
      name: {
        es: `${vehicle.brand} ${vehicle.model} ${vehicle.version || ''} (${vehicle.year})`.trim()
      },
      description: {
        es: vehicle.catalog_description || `${vehicle.brand} ${vehicle.model} año ${vehicle.year}. ${vehicle.mileage.toLocaleString()} km.`
      },
      price: vehicle.sale_price.toString(),
      currency: vehicle.sale_currency || 'USD',
      published: vehicle.status === 'publicado',
      images: (vehicle.images || []).map((url) => ({ src: url }))
    };

    let response;
    let resultId = vehicle.tiendanube_id;

    if (vehicle.tiendanube_id) {
      // Actualizar producto existente
      response = await fetch(`${tiendanubeApiBase}/products/${vehicle.tiendanube_id}`, {
        method: 'PUT',
        headers: {
          'Authentication': `bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'CARVLAK-Hub/1.0 (contacto@carvlak.com)'
        },
        body: JSON.stringify(productData)
      });
    } else if (action === 'publish') {
      // Crear producto nuevo
      response = await fetch(`${tiendanubeApiBase}/products`, {
        method: 'POST',
        headers: {
          'Authentication': `bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'CARVLAK-Hub/1.0 (contacto@carvlak.com)'
        },
        body: JSON.stringify(productData)
      });
      if (response.ok) {
        const createdData = await response.json();
        resultId = createdData.id?.toString();
      }
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'pending',
          error: 'El vehículo no tiene ID de Tiendanube y la acción no es publicar',
          vehicleId: vehicle.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({
          success: false,
          status: 'error',
          error: `Error Tiendanube API (${response.status}): ${errText}`,
          vehicleId: vehicle.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const responseJson = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        status: 'synced',
        tiendanube_id: resultId || responseJson.id?.toString(),
        synced_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        status: 'error',
        error: err?.message || 'Error inesperado en sincronización Tiendanube'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
