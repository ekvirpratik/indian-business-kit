import { supabase } from './supabaseClient';

export const uploadImage = async (userId, file, path) => {
  if (!userId) throw new Error('User ID is required for uploading images');
  
  // Use upsert so we overwrite if the same file path is uploaded
  const { error } = await supabase.storage
    .from('crm-assets')
    .upload(`${userId}/${path}`, file, {
      upsert: true,
      contentType: file.type,
    });
  
  if (error) {
    throw error;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('crm-assets')
    .getPublicUrl(`${userId}/${path}`);
     
  return publicUrl;
};

export const deleteImage = async (userId, path) => {
  if (!userId) throw new Error('User ID is required for deleting images');
  
  const { error } = await supabase.storage
    .from('crm-assets')
    .remove([`${userId}/${path}`]);
     
  if (error) {
    throw error;
  }
};
