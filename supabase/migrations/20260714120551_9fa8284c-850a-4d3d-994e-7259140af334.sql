
DROP POLICY IF EXISTS "Anyone can read active payment methods" ON public.payment_methods;

REVOKE SELECT ON public.payment_methods FROM anon;

CREATE POLICY "Authenticated users can read active payment methods"
ON public.payment_methods
FOR SELECT
TO authenticated
USING (is_active = true);
