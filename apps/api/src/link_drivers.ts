
import { getSupabaseAdminClient } from '../src/lib/supabase.js';

async function linkDriversAndBuses() {
  const admin = getSupabaseAdminClient();
  
  console.log('Fetching drivers and buses...');
  const { data: drivers } = await admin.from('drivers').select('id, full_name').order('created_at');
  const { data: buses } = await admin.from('buses').select('id, vehicle_number').order('created_at');
  
  if (!drivers || !buses) {
    console.error('Failed to fetch data');
    return;
  }
  
  const count = Math.min(drivers.length, buses.length);
  console.log(`Found ${drivers.length} drivers and ${buses.length} buses. Linking ${count} pairs...`);
  
  for (let i = 0; i < count; i++) {
    const driver = drivers[i];
    const bus = buses[i];
    
    console.log(`Linking Driver: ${driver.full_name} (${driver.id}) <--> Bus: ${bus.vehicle_number} (${bus.id})`);
    
    const { error: dError } = await admin
      .from('drivers')
      .update({ assigned_bus_id: bus.id })
      .eq('id', driver.id);
      
    const { error: bError } = await admin
      .from('buses')
      .update({ driver_id: driver.id })
      .eq('id', bus.id);
      
    if (dError || bError) {
      console.error(`Error linking pair ${i}:`, dError || bError);
    }
  }
  
  console.log('Linking complete!');
}

linkDriversAndBuses().catch(console.error);
