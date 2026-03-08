CREATE POLICY "Users can delete their own recommendations"
ON public.recommendations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);