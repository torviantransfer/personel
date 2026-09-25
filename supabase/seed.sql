-- Örnek giriş noktası. QR içeriği: WORKPLACE:<qr_token>
insert into public.workplaces (name) values ('Merkez Ofis');

-- QR'a basılacak metni görmek için:
-- select name, 'WORKPLACE:' || qr_token as qr_content from public.workplaces;

-- Personel eklemek için: npm run user:create (README'ye bakın)
