## 1) Data Structure

#### 1. Bagaimana memori untuk `list` dialokasikan dan dikelola dalam metode `createList`?
JAWABAN:
- Tidak ada metode `createList` dalam kode yang diberikan
- Dalam konteks `countPairs()`: HashMap dialokasikan di heap, variabel primitif di stack
- JVM mengelola alokasi otomatis via `new HashMap<>()`

#### 2. Apa yang akan terjadi pada memori yang dialokasikan untuk `list` setelah metode `createList` selesai dieksekusi?
JAWABAN:
- Stack frame method akan dibersihkan (variabel lokal: `freqMap`, `count`, `complement`)
- Heap objects (`HashMap` + `entries`) menjadi eligible untuk `GC` karena tidak ada referensi external
- Automatic cleanup - tidak perlu manual intervention

#### 3. Apakah ada potensi kebocoran memori dalam kode di atas?
JAWABAN:
- TIDAK ADA memory leak dalam kode `PairSum`
- Reasoning:
  - `HashMap` bersifat lokal, tidak ada static references
  - Tidak ada circular references yang problematik
  - Tidak ada resource management (`files`, `connections`) yang tidak ditutup
  - `GC` akan membersihkan otomatis setelah method selesai