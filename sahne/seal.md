# Kapı mühürü

Her kapı n (1 ≤ n ≤ 444050) için:

1. Katmanlar sırayla: bekleyen 8×50000, sergi 8×5000, hazir 8×500, kullanimda 1×50. n hangi katmana düşüyorsa o katmanın içindeki sıra k'dir.
2. blok = floor((k-1) / blok_boyu) + 1, sira = (k-1) mod blok_boyu + 1.
3. kimlik = "K-" + n'nin 6 haneli sıfır dolgulu yazımı.
4. şerit g ∈ {1,4,8,11} için: ((n-1) mod g) + 1.
5. mühür = SHA-256( UTF-8 "selinahbap|" + kimlik + "|" + katman + "|" + blok ) onaltılık yazımının ilk 12 karakteri.

Ayırıcı `|`, boşluk yok, katman adları küçük harf ve ASCII: bekleyen, sergi, hazir, kullanimda.

Örnek: n = 444001 → girdi `selinahbap|K-444001|kullanimda|1` → mühür `0f6d25435d42`.
