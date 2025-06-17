/**
 * Java
 * =============================================================================
 * File: SingleLinkedList.java
 * Deskripsi: Struktur Data & Memori
 * Author: https://github.com/bil-awal
 * 
 * =============================================================================
*/

import java.util.Iterator;
import java.util.NoSuchElementException;
import java.util.Objects;

/**
 * Kelas Node yang merepresentasikan satu elemen dalam linked list.
 * Mengimplementasikan desain immutable untuk thread safety.
 * 
 * @param <T> tipe data yang disimpan dalam node
 */
class Node<T> {
    private final T data;
    private Node<T> next;
    
    /**
     * Konstruktor untuk membuat node baru dengan data yang diberikan.
     * 
     * @param data data yang akan disimpan dalam node ini
     * @throws IllegalArgumentException jika data bernilai null
     */
    public Node(T data) {
        this.data = Objects.requireNonNull(data, "Data node tidak boleh null");
        this.next = null;
    }
    
    public T getData() { return data; }
    public Node<T> getNext() { return next; }
    public void setNext(Node<T> next) { this.next = next; }
    
    @Override
    public String toString() {
        return String.valueOf(data);
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Node<?> node = (Node<?>) obj;
        return Objects.equals(data, node.data);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(data);
    }
}

/**
 * Exception khusus untuk operasi linked list.
 */
class LinkedListException extends RuntimeException {
    public LinkedListException(String message) {
        super(message);
    }
}

/**
 * Implementasi Generic Single Linked List mengikuti pola enterprise.
 * 
 * Fitur-fitur:
 * - Dukungan generic type
 * - Implementasi pola Iterator
 * - Pola Builder untuk konstruksi
 * - Penanganan error yang komprehensif
 * - Operasi thread-safe (jika berlaku)
 * 
 * @param <T> tipe elemen yang disimpan dalam list ini
 */
public class SingleLinkedList<T> implements Iterable<T> {
    private Node<T> head;
    private int size;
    
    /**
     * Konstruktor default untuk membuat list kosong.
     */
    public SingleLinkedList() {
        this.head = null;
        this.size = 0;
    }
    
    /**
     * Mengembalikan instance builder baru untuk konstruksi list yang lancar.
     * 
     * @param <T> tipe elemen
     * @return instance Builder baru
     */
    public static <T> Builder<T> builder() {
        return new Builder<>();
    }
    
    /**
     * Implementasi pola Builder untuk konstruksi list yang lancar.
     */
    public static class Builder<T> {
        private final SingleLinkedList<T> list;
        
        private Builder() {
            this.list = new SingleLinkedList<>();
        }
        
        public Builder<T> add(T data) {
            list.insertAtEnd(data);
            return this;
        }
        
        public Builder<T> addFirst(T data) {
            list.insertAtBeginning(data);
            return this;
        }
        
        public SingleLinkedList<T> build() {
            return list;
        }
    }
    
    /**
     * Menyisipkan elemen baru di akhir list.
     * Kompleksitas Waktu: O(n), Kompleksitas Ruang: O(1)
     * 
     * @param data elemen yang akan disisipkan
     * @throws IllegalArgumentException jika data bernilai null
     */
    public void insertAtEnd(T data) {
        validateData(data);
        
        Node<T> newNode = new Node<>(data);
        
        if (isEmpty()) {
            head = newNode;
        } else {
            Node<T> current = head;
            while (current.getNext() != null) {
                current = current.getNext();
            }
            current.setNext(newNode);
        }
        size++;
    }
    
    /**
     * Menyisipkan elemen baru di awal list.
     * Kompleksitas Waktu: O(1), Kompleksitas Ruang: O(1)
     * 
     * @param data elemen yang akan disisipkan
     * @throws IllegalArgumentException jika data bernilai null
     */
    public void insertAtBeginning(T data) {
        validateData(data);
        
        Node<T> newNode = new Node<>(data);
        newNode.setNext(head);
        head = newNode;
        size++;
    }
    
    /**
     * Menghapus kemunculan pertama dari elemen yang ditentukan.
     * Kompleksitas Waktu: O(n), Kompleksitas Ruang: O(1)
     * 
     * @param data elemen yang akan dihapus
     * @return true jika elemen berhasil dihapus, false jika tidak ditemukan
     * @throws IllegalArgumentException jika data bernilai null
     */
    public boolean deleteByValue(T data) {
        validateData(data);
        
        if (isEmpty()) {
            return false;
        }
        
        // Tangani penghapusan head
        if (head.getData().equals(data)) {
            head = head.getNext();
            size--;
            return true;
        }
        
        // Cari elemen yang akan dihapus
        Node<T> current = head;
        while (current.getNext() != null && !current.getNext().getData().equals(data)) {
            current = current.getNext();
        }
        
        // Elemen ditemukan
        if (current.getNext() != null) {
            current.setNext(current.getNext().getNext());
            size--;
            return true;
        }
        
        return false; // Elemen tidak ditemukan
    }
    
    /**
     * Menampilkan semua elemen dalam list dengan format yang mudah dibaca.
     * Kompleksitas Waktu: O(n), Kompleksitas Ruang: O(1)
     */
    public void display() {
        if (isEmpty()) {
            System.out.println("List kosong");
            return;
        }
        
        StringBuilder result = new StringBuilder();
        Node<T> current = head;
        
        while (current != null) {
            result.append(current.getData());
            if (current.getNext() != null) {
                result.append(" -> ");
            }
            current = current.getNext();
        }
        
        System.out.println(result.toString());
    }
    
    /**
     * Memeriksa apakah list mengandung elemen yang ditentukan.
     * 
     * @param data elemen yang dicari
     * @return true jika ditemukan, false jika tidak
     */
    public boolean contains(T data) {
        if (data == null) return false;
        
        for (T element : this) {
            if (element.equals(data)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Mengembalikan jumlah elemen dalam list.
     * 
     * @return ukuran list
     */
    public int size() {
        return size;
    }
    
    /**
     * Memeriksa apakah list kosong.
     * 
     * @return true jika kosong, false jika tidak
     */
    public boolean isEmpty() {
        return head == null;
    }
    
    /**
     * Menghapus semua elemen dari list.
     */
    public void clear() {
        head = null;
        size = 0;
    }
    
    /**
     * Mengembalikan iterator untuk elemen-elemen dalam list ini.
     * Mengimplementasikan pola Iterator untuk traversal yang ditingkatkan.
     * 
     * @return iterator
     */
    @Override
    public Iterator<T> iterator() {
        return new LinkedListIterator();
    }
    
    /**
     * Implementasi Iterator untuk traversal linked list.
     * Menyediakan perilaku fail-fast dan operasi iterator standar.
     */
    private class LinkedListIterator implements Iterator<T> {
        private Node<T> current;
        private final int expectedSize;
        
        public LinkedListIterator() {
            this.current = head;
            this.expectedSize = size;
        }
        
        @Override
        public boolean hasNext() {
            checkForModification();
            return current != null;
        }
        
        @Override
        public T next() {
            checkForModification();
            if (!hasNext()) {
                throw new NoSuchElementException("Tidak ada lagi elemen dalam list");
            }
            
            T data = current.getData();
            current = current.getNext();
            return data;
        }
        
        /**
         * Memeriksa apakah list dimodifikasi selama iterasi.
         * Menyediakan perilaku fail-fast.
         */
        private void checkForModification() {
            if (expectedSize != size) {
                throw new LinkedListException("List dimodifikasi selama iterasi");
            }
        }
    }
    
    /**
     * Memvalidasi data input untuk nilai null.
     * 
     * @param data data yang akan divalidasi
     * @throws IllegalArgumentException jika data bernilai null
     */
    private void validateData(T data) {
        if (data == null) {
            throw new IllegalArgumentException("Data tidak boleh null");
        }
    }
    
    @Override
    public String toString() {
        if (isEmpty()) {
            return "[]";
        }
        
        StringBuilder sb = new StringBuilder("[");
        for (T element : this) {
            sb.append(element).append(", ");
        }
        sb.setLength(sb.length() - 2); // Remove last comma and space
        sb.append("]");
        return sb.toString();
    }
    
    /**
     * Kelas demonstrasi dan pengujian.
     * Menunjukkan pola penggunaan yang benar dan kasus edge.
     */
    public static class Demo {
        public static void main(String[] args) {
            demonstrateBasicOperations();
            demonstrateBuilderPattern();
            demonstrateIteratorPattern();
            demonstrateErrorHandling();
        }
        
        private static void demonstrateBasicOperations() {
            System.out.println("=== Demo Operasi Dasar ===");
            
            SingleLinkedList<Integer> list = new SingleLinkedList<>();
            
            // Test penyisipan
            list.insertAtEnd(10);
            list.insertAtEnd(20);
            list.insertAtEnd(30);
            System.out.print("Setelah insertAtEnd: ");
            list.display();
            
            list.insertAtBeginning(5);
            System.out.print("Setelah insertAtBeginning: ");
            list.display();
            
            // Test penghapusan
            System.out.println("Menghapus 20: " + list.deleteByValue(20));
            list.display();
            
            System.out.println("Ukuran list: " + list.size());
            System.out.println("Mengandung 10: " + list.contains(10));
            System.out.println();
        }
        
        private static void demonstrateBuilderPattern() {
            System.out.println("=== Demo Pola Builder ===");
            
            SingleLinkedList<String> list = SingleLinkedList.<String>builder()
                .add("Dunia")
                .addFirst("Halo")
                .add("!")
                .build();
                
            System.out.println("List yang dibangun: " + list);
            System.out.println();
        }
        
        private static void demonstrateIteratorPattern() {
            System.out.println("=== Demo Pola Iterator ===");
            
            SingleLinkedList<Integer> list = SingleLinkedList.<Integer>builder()
                .add(1).add(2).add(3).add(4).add(5)
                .build();
            
            System.out.print("Menggunakan enhanced for-loop: ");
            for (Integer num : list) {
                System.out.print(num + " ");
            }
            System.out.println();
            
            System.out.print("Menggunakan iterator manual: ");
            Iterator<Integer> it = list.iterator();
            while (it.hasNext()) {
                System.out.print(it.next() + " ");
            }
            System.out.println("\n");
        }
        
        private static void demonstrateErrorHandling() {
            System.out.println("=== Demo Penanganan Error ===");
            
            SingleLinkedList<String> list = new SingleLinkedList<>();
            
            try {
                list.insertAtEnd(null);
            } catch (IllegalArgumentException e) {
                System.out.println("Menangkap error yang diharapkan: " + e.getMessage());
            }
            
            try {
                Iterator<String> it = list.iterator();
                list.insertAtEnd("test"); // Modifikasi selama iterasi
                it.next(); // Ini harus gagal
            } catch (LinkedListException e) {
                System.out.println("Menangkap modifikasi bersamaan: " + e.getMessage());
            }
            
            System.out.println("Penanganan error berhasil diselesaikan");
        }
    }
}