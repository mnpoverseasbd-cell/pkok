
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_broadcast BOOLEAN NOT NULL DEFAULT FALSE,
  category TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_notifications_broadcast ON public.notifications(created_at DESC) WHERE is_broadcast = TRUE;

-- Track per-user read state for broadcasts
CREATE TABLE public.notification_reads (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, notification_id)
);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT, INSERT, DELETE ON public.notification_reads TO authenticated;
GRANT ALL ON public.notification_reads TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- Users can read own notifications OR any broadcast
CREATE POLICY "read own or broadcast" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_broadcast = TRUE);

-- Users can mark their own personal notifications as read
CREATE POLICY "update own personal" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can manage all
CREATE POLICY "admins manage notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Broadcast reads: user manages own row only
CREATE POLICY "manage own reads" ON public.notification_reads
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger: auto-create notifications on transaction status change
CREATE OR REPLACE FUNCTION public.notify_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  t_title TEXT;
  t_body TEXT;
  t_cat TEXT := 'wallet';
BEGIN
  -- Only fire on status change or fresh insert with approved/rejected
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.type = 'deposit' AND NEW.status = 'approved' THEN
    t_title := '✅ ডিপোজিট সফল';
    t_body := '৳ ' || NEW.amount || ' আপনার ওয়ালেটে যোগ হয়েছে।';
  ELSIF NEW.type = 'deposit' AND NEW.status = 'rejected' THEN
    t_title := '❌ ডিপোজিট বাতিল';
    t_body := '৳ ' || NEW.amount || ' এর ডিপোজিট রিকোয়েস্ট বাতিল হয়েছে।';
  ELSIF NEW.type = 'withdraw' AND NEW.status = 'approved' THEN
    t_title := '✅ উত্তোলন অনুমোদিত';
    t_body := '৳ ' || NEW.amount || ' আপনার অ্যাকাউন্টে পাঠানো হয়েছে।';
  ELSIF NEW.type = 'withdraw' AND NEW.status = 'rejected' THEN
    t_title := '❌ উত্তোলন বাতিল';
    t_body := '৳ ' || NEW.amount || ' এর উত্তোলন রিকোয়েস্ট বাতিল হয়েছে।';
  ELSIF NEW.type = 'bonus' AND NEW.status = 'approved' THEN
    t_title := '🎁 বোনাস পেয়েছেন';
    t_body := '৳ ' || NEW.amount || ' — ' || COALESCE(NEW.admin_note, 'বোনাস');
    t_cat := 'bonus';
  ELSIF NEW.type = 'cashback' AND NEW.status = 'approved' THEN
    t_title := '💰 ক্যাশব্যাক পেয়েছেন';
    t_body := '৳ ' || NEW.amount || ' ক্যাশব্যাক ক্রেডিট হয়েছে।';
    t_cat := 'bonus';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, category, title, body, link, metadata)
  VALUES (NEW.user_id, t_cat, t_title, t_body, '/wallet?tab=history',
          jsonb_build_object('txn_id', NEW.id, 'type', NEW.type, 'amount', NEW.amount));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_transaction ON public.transactions;
CREATE TRIGGER trg_notify_on_transaction
  AFTER INSERT OR UPDATE OF status ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_transaction();

-- Trigger: notify on VIP tier upgrade
CREATE OR REPLACE FUNCTION public.notify_on_vip_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.vip_tier IS DISTINCT FROM OLD.vip_tier THEN
    INSERT INTO public.notifications (user_id, category, title, body, link)
    VALUES (NEW.id, 'vip',
            '👑 VIP আপগ্রেড: ' || UPPER(NEW.vip_tier::text),
            'অভিনন্দন! আপনি এখন ' || UPPER(NEW.vip_tier::text) || ' টিয়ারে। নতুন বোনাস ও ক্যাশব্যাক উপভোগ করুন।',
            '/vip');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_vip_upgrade ON public.profiles;
CREATE TRIGGER trg_notify_on_vip_upgrade
  AFTER UPDATE OF vip_tier ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_vip_upgrade();

-- Helper: unread count (personal unread + broadcasts not in reads table)
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    (SELECT COUNT(*)::int FROM public.notifications
      WHERE user_id = auth.uid() AND read_at IS NULL)
    +
    (SELECT COUNT(*)::int FROM public.notifications n
      WHERE n.is_broadcast = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM public.notification_reads r
          WHERE r.notification_id = n.id AND r.user_id = auth.uid()
        ))
  );
$$;

-- List notifications combining personal + broadcast with computed is_read
CREATE OR REPLACE FUNCTION public.list_my_notifications(_limit integer DEFAULT 30)
RETURNS TABLE(id uuid, category text, title text, body text, link text, metadata jsonb,
              is_broadcast boolean, created_at timestamptz, is_read boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT n.id, n.category, n.title, n.body, n.link, n.metadata, n.is_broadcast, n.created_at,
    CASE
      WHEN n.is_broadcast THEN EXISTS (
        SELECT 1 FROM public.notification_reads r
        WHERE r.notification_id = n.id AND r.user_id = auth.uid())
      ELSE n.read_at IS NOT NULL
    END AS is_read
  FROM public.notifications n
  WHERE n.user_id = auth.uid() OR n.is_broadcast = TRUE
  ORDER BY n.created_at DESC
  LIMIT _limit;
$$;

-- Mark all as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.notifications SET read_at = now()
    WHERE user_id = auth.uid() AND read_at IS NULL;
  INSERT INTO public.notification_reads (user_id, notification_id)
    SELECT auth.uid(), n.id FROM public.notifications n
    WHERE n.is_broadcast = TRUE
      AND NOT EXISTS (SELECT 1 FROM public.notification_reads r
                      WHERE r.notification_id = n.id AND r.user_id = auth.uid());
END;
$$;

-- Mark a single one as read (works for both personal and broadcast)
CREATE OR REPLACE FUNCTION public.mark_notification_read(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_bc boolean;
BEGIN
  SELECT is_broadcast INTO is_bc FROM public.notifications WHERE id = _id;
  IF is_bc THEN
    INSERT INTO public.notification_reads (user_id, notification_id)
    VALUES (auth.uid(), _id)
    ON CONFLICT DO NOTHING;
  ELSE
    UPDATE public.notifications SET read_at = now()
      WHERE id = _id AND user_id = auth.uid() AND read_at IS NULL;
  END IF;
END;
$$;
