import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Storage bucket'ı kontrol et ve gerekirse oluştur
export async function ensureBucketExists(bucketName: string, isPublic: boolean = false) {
  const supabase = createClientComponentClient();
  
  try {
    // Bucket'ları listele
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      throw bucketsError;
    }
    
    // Bucket var mı kontrol et
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    // Bucket yoksa oluştur
    if (!bucketExists) {
      const { error: createBucketError } = await supabase
        .storage
        .createBucket(bucketName, { public: isPublic });
      
      if (createBucketError) {
        throw createBucketError;
      }
      
      console.log(`"${bucketName}" bucket'ı oluşturuldu.`);
      return true;
    }
    
    return true;
  } catch (error) {
    console.error(`"${bucketName}" bucket'ı kontrol edilirken hata:`, error);
    return false;
  }
}

// Dosya yükle
export async function uploadFile(
  bucketName: string,
  filePath: string,
  file: File,
  options?: { upsert?: boolean, cacheControl?: string }
) {
  const supabase = createClientComponentClient();
  
  try {
    // Bucket'ın var olduğundan emin ol
    const bucketExists = await ensureBucketExists(bucketName, true);
    
    if (!bucketExists) {
      throw new Error(`"${bucketName}" bucket'ı oluşturulamadı.`);
    }
    
    // Dosyayı yükle
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, options);
    
    if (error) {
      throw error;
    }
    
    // Dosya URL'ini al
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return { data, publicUrl };
  } catch (error) {
    console.error(`"${bucketName}" bucket'ına dosya yüklenirken hata:`, error);
    throw error;
  }
} 