BEGIN;
-- Existing cancelled orders are NOT automatically credited: reconcile manually once.
REVOKE ALL ON FUNCTION public.create_cod_order(uuid,text,text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.submit_cod_order(uuid,uuid,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_cod_order(uuid,uuid,text,text,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.v5_order_transition() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE item record;
BEGIN
 IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
 IF NOT ((OLD.status='pending' AND NEW.status IN ('confirmed','cancelled')) OR (OLD.status='confirmed' AND NEW.status IN ('shipped','cancelled')) OR (OLD.status='shipped' AND NEW.status IN ('delivered','returned')) OR (OLD.status='delivered' AND NEW.status='returned')) THEN RAISE EXCEPTION 'Transition de statut interdite'; END IF;
 IF NEW.status='cancelled' THEN
 FOR item IN SELECT product_id,sum(quantity)::integer AS qty FROM public.order_items WHERE order_id=OLD.id GROUP BY product_id ORDER BY product_id LOOP
 INSERT INTO public.inventory(product_id,quantity,updated_at) VALUES(item.product_id,item.qty,now()) ON CONFLICT(product_id) DO UPDATE SET quantity=public.inventory.quantity+EXCLUDED.quantity,updated_at=now();
 END LOOP;
 END IF;
 NEW.updated_at=now(); RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.v5_order_transition() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS v5_order_transition ON public.orders;
CREATE TRIGGER v5_order_transition BEFORE UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.v5_order_transition();
COMMIT;
