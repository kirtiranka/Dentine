import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { PatientDocument, DocumentType } from '../types/document';

const BUCKET_NAME = 'clinic-docs';

export function getDocumentPublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  return data.publicUrl;
}

export function useDocuments(patientId: string | undefined) {
  return useQuery({
    queryKey: ['documents', patientId],
    queryFn: async (): Promise<PatientDocument[]> => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from('document')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as PatientDocument[]) || [];
    },
    enabled: Boolean(patientId),
  });
}

export function useUploadDocument(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clinicId,
      name,
      type,
      file,
    }: {
      clinicId: string;
      name: string;
      type: DocumentType;
      file: File;
    }) => {
      // 1. Generate collision-resistant storage path: clinicId/patientId/timestamp_filename
      const fileExt = file.name.split('.').pop();
      const sanitizedBaseName = file.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const storagePath = `${clinicId}/${patientId}/${Date.now()}_${sanitizedBaseName}.${fileExt}`;

      // 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

      // 3. Insert metadata into Postgres document table
      const { data, error: dbError } = await supabase
        .from('document')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          name,
          type,
          storage_path: storagePath,
        })
        .select()
        .single();

      if (dbError) throw new Error(`Database record failed: ${dbError.message}`);
      return data as PatientDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', patientId] });
    },
  });
}

export function useUpdateDocument(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      type,
    }: {
      id: string;
      name: string;
      type: DocumentType;
    }) => {
      const { data, error } = await supabase
        .from('document')
        .update({
          name,
          type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as PatientDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', patientId] });
    },
  });
}