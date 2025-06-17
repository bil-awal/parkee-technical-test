package com.parkee.parkingpos.controller;

import com.parkee.parkingpos.dto.*;
import com.parkee.parkingpos.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Controller utama untuk sistem Parking POS
 * Menangani semua endpoint terkait parkir, member, voucher, dan pembayaran
 *
 * @author Parkee Development Team
 * @version 1.0
 */
@RestController
@RequestMapping("/parking")
@RequiredArgsConstructor
@Tag(name = "Parking POS", description = "API untuk sistem parkir POS")
public class ParkingController {

    private final ParkingService parkingService;
    private final MemberService memberService;
    private final VoucherService voucherService;
    private final InvoiceReceiptService invoiceReceiptService;
    private final DashboardService dashboardService;

    // ======================== PARKING ENDPOINTS ========================

    /**
     * Check-in kendaraan baru
     * Validasi plate number tidak sedang parkir
     * Upload foto kendaraan masuk
     */
    @PostMapping(value = "/check-in", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Check-in kendaraan",
            description = "Melakukan check-in kendaraan dengan upload foto. Sistem akan memvalidasi apakah kendaraan dengan plat nomor yang sama sedang parkir."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Check-in berhasil",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Check-in berhasil",
                                              "data": {
                                                "ticketNumber": "TKT-20250116-001",
                                                "plateNumber": "B 1234 ABC",
                                                "vehicleType": "MOBIL",
                                                "checkInTime": "2025-01-16T10:30:00",
                                                "location": "Lantai 1 - A12"
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad Request - Validasi gagal atau kendaraan sudah parkir",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "message": "Kendaraan dengan plat nomor B 1234 ABC sedang parkir",
                                              "data": null
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Internal Server Error",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "message": "Terjadi kesalahan sistem",
                                              "data": null
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<ParkingTicketResponseDto>> checkIn(
            @Valid @RequestPart("data") CheckInRequestDto request,
            @RequestPart(value = "photo", required = false) MultipartFile photo) {

        ParkingTicketResponseDto ticket = parkingService.checkIn(request, photo);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(com.parkee.parkingpos.dto.ApiResponse.success("Check-in berhasil", ticket));
    }

    /**
     * Cek status parkir berdasarkan plate number
     * Menampilkan info parkir yang sedang aktif dengan foto
     */
    @GetMapping("/status/{plateNumber}")
    @Operation(
            summary = "Cek status parkir",
            description = "Mengecek status parkir berdasarkan nomor plat. Menampilkan informasi detail parkir yang sedang aktif termasuk foto check-in/check-out dan URL untuk mengakses foto."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Data parkir ditemukan",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = {
                                    @ExampleObject(
                                            name = "Active Parking (with check-in photo)",
                                            description = "Kendaraan yang sedang parkir dengan foto check-in",
                                            value = """
                                                {
                                                  "success": true,
                                                  "message": "Data parkir ditemukan",
                                                  "data": {
                                                    "id": 1,
                                                    "plateNumber": "B123FRD",
                                                    "vehicleType": "CAR",
                                                    "checkInTime": "2025-01-16T10:30:00",
                                                    "checkOutTime": null,
                                                    "checkInGate": "GATE_A",
                                                    "checkOutGate": null,
                                                    "checkInOperator": "John Doe",
                                                    "checkOutOperator": null,
                                                    "status": "ACTIVE",
                                                    "memberName": "Jane Smith",
                                                    "parkingFee": null,
                                                    "checkInPhotoPath": "checkin/2025/01/16/checkin_1737019800123_abc12345.jpg",
                                                    "checkOutPhotoPath": null,
                                                    "checkInPhotoUrl": "http://localhost:8081/api/parking/photos/checkin/2025/01/16/checkin_1737019800123_abc12345.jpg",
                                                    "checkOutPhotoUrl": null
                                                  }
                                                }
                                                """
                                    ),
                                    @ExampleObject(
                                            name = "Completed Parking (with both photos)",
                                            description = "Kendaraan yang sudah checkout dengan foto check-in dan check-out",
                                            value = """
                                                {
                                                  "success": true,
                                                  "message": "Data parkir ditemukan",
                                                  "data": {
                                                    "id": 1,
                                                    "plateNumber": "B123FRD",
                                                    "vehicleType": "CAR",
                                                    "checkInTime": "2025-01-16T10:30:00",
                                                    "checkOutTime": "2025-01-16T14:45:00",
                                                    "checkInGate": "GATE_A",
                                                    "checkOutGate": "GATE_B",
                                                    "checkInOperator": "John Doe",
                                                    "checkOutOperator": "Jane Smith",
                                                    "status": "COMPLETED",
                                                    "memberName": "Jane Smith",
                                                    "parkingFee": 15000.00,
                                                    "checkInPhotoPath": "checkin/2025/01/16/checkin_1737019800123_abc12345.jpg",
                                                    "checkOutPhotoPath": "checkout/2025/01/16/checkout_1737035100456_def67890.jpg",
                                                    "checkInPhotoUrl": "http://localhost:8081/api/parking/photos/checkin/2025/01/16/checkin_1737019800123_abc12345.jpg",
                                                    "checkOutPhotoUrl": "http://localhost:8081/api/parking/photos/checkout/2025/01/16/checkout_1737035100456_def67890.jpg"
                                                  }
                                                }
                                                """
                                    ),
                                    @ExampleObject(
                                            name = "Parking without photos",
                                            description = "Kendaraan parkir tanpa foto (foto opsional)",
                                            value = """
                                                {
                                                  "success": true,
                                                  "message": "Data parkir ditemukan",
                                                  "data": {
                                                    "id": 2,
                                                    "plateNumber": "D456GHI",
                                                    "vehicleType": "MOTORCYCLE",
                                                    "checkInTime": "2025-01-16T11:15:00",
                                                    "checkOutTime": null,
                                                    "checkInGate": "GATE_B",
                                                    "checkOutGate": null,
                                                    "checkInOperator": "Alice Johnson",
                                                    "checkOutOperator": null,
                                                    "status": "ACTIVE",
                                                    "memberName": null,
                                                    "parkingFee": null,
                                                    "checkInPhotoPath": null,
                                                    "checkOutPhotoPath": null,
                                                    "checkInPhotoUrl": null,
                                                    "checkOutPhotoUrl": null
                                                  }
                                                }
                                                """
                                    )
                            }
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Data parkir tidak ditemukan",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                        {
                                          "success": false,
                                          "message": "Tidak ada kendaraan aktif dengan plat nomor: B123FRD",
                                          "data": null
                                        }
                                        """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Format plat nomor tidak valid",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                        {
                                          "success": false,
                                          "message": "Format plat nomor tidak valid",
                                          "data": null
                                        }
                                        """
                            )
                    )
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<ParkingTicketResponseDto>> checkStatus(
            @Parameter(
                    description = "Nomor plat kendaraan (format Indonesia)",
                    example = "B123FRD",
                    required = true
            )
            @PathVariable String plateNumber) {

        ParkingTicketResponseDto ticket = parkingService.getActiveTicketByPlateNumber(plateNumber);
        return ResponseEntity.ok(com.parkee.parkingpos.dto.ApiResponse.success("Data parkir ditemukan", ticket));
    }

    /**
     * Kalkulasi biaya parkir sebelum checkout
     * Menghitung total biaya dan menampilkan detail
     */
    @GetMapping("/calculate/{plateNumber}")
    @Operation(
            summary = "Kalkulasi biaya parkir",
            description = "Menghitung biaya parkir sebelum checkout. Dapat menerapkan voucher diskon jika tersedia."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Kalkulasi biaya berhasil",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Kalkulasi biaya berhasil",
                                              "data": {
                                                "plateNumber": "B 1234 ABC",
                                                "checkInTime": "2025-01-16T10:30:00",
                                                "checkOutTime": "2025-01-16T13:45:00",
                                                "duration": "3 jam 15 menit",
                                                "baseFee": 12000,
                                                "voucherCode": "DISC20",
                                                "voucherDiscount": 2400,
                                                "totalFee": 9600
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Data parkir tidak ditemukan",
                    content = @Content(mediaType = "application/json")
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Voucher tidak valid atau sudah kadaluarsa",
                    content = @Content(mediaType = "application/json")
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<ParkingCalculationDto>> calculateFee(
            @PathVariable String plateNumber,
            @RequestParam(required = false) String voucherCode) {

        ParkingCalculationDto calculation = parkingService.calculateParkingFee(plateNumber, voucherCode);
        return ResponseEntity.ok(com.parkee.parkingpos.dto.ApiResponse.success("Kalkulasi biaya berhasil", calculation));
    }

    /**
     * Check-out kendaraan
     * Proses pembayaran dan upload foto keluar
     */
    @PostMapping(value = "/check-out", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Check-out kendaraan",
            description = "Melakukan check-out dan pembayaran. Menghasilkan invoice dan struk pembayaran."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Check-out berhasil",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Check-out berhasil",
                                              "data": {
                                                "invoiceNumber": "INV-20250116-0001",
                                                "plateNumber": "B 1234 ABC",
                                                "checkInTime": "2025-01-16T10:30:00",
                                                "checkOutTime": "2025-01-16T13:45:00",
                                                "duration": "3 jam 15 menit",
                                                "totalFee": 12000,
                                                "paymentMethod": "CASH",
                                                "paymentStatus": "PAID"
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Data parkir tidak ditemukan",
                    content = @Content(mediaType = "application/json")
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Pembayaran gagal atau data tidak valid",
                    content = @Content(mediaType = "application/json")
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<InvoiceReceiptDto>> checkOut(
            @Valid @RequestPart("data") CheckOutRequestDto request,
            @RequestPart(value = "photo", required = false) MultipartFile photo) {

        InvoiceReceiptDto invoice = parkingService.checkOut(request, photo);
        return ResponseEntity.ok(com.parkee.parkingpos.dto.ApiResponse.success("Check-out berhasil", invoice));
    }

    // ======================== MEMBER ENDPOINTS ========================

    /**
     * Registrasi member baru
     * Member mendapat benefit khusus
     */
    @PostMapping("/members")
    @Operation(
            summary = "Registrasi member",
            description = "Mendaftarkan member baru. Member akan mendapatkan benefit seperti diskon dan kemudahan pembayaran."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Registrasi member berhasil",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Registrasi member berhasil",
                                              "data": {
                                                "memberId": 1001,
                                                "memberCode": "MBR-1001",
                                                "name": "John Doe",
                                                "email": "john.doe@email.com",
                                                "phone": "081234567890",
                                                "plateNumbers": ["B 1234 ABC", "B 5678 DEF"],
                                                "balance": 0,
                                                "memberType": "REGULAR",
                                                "joinDate": "2025-01-16"
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Data tidak valid atau email/phone sudah terdaftar",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "message": "Email sudah terdaftar",
                                              "data": null
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<MemberResponseDto>> registerMember(
            @Valid @RequestBody MemberRegistrationDto request) {

        MemberResponseDto member = memberService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(com.parkee.parkingpos.dto.ApiResponse.success("Registrasi member berhasil", member));
    }

    /**
     * Get all members dengan pagination
     */
    @GetMapping("/members")
    @Operation(
            summary = "List member",
            description = "Mendapatkan daftar member dengan pagination. Dapat melakukan pencarian berdasarkan nama atau nomor plat."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Data member berhasil diambil",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Data member berhasil diambil",
                                              "data": {
                                                "content": [
                                                  {
                                                    "memberId": 1001,
                                                    "memberCode": "MBR-1001",
                                                    "name": "John Doe",
                                                    "email": "john.doe@email.com",
                                                    "balance": 50000,
                                                    "memberType": "GOLD",
                                                    "isActive": true
                                                  }
                                                ],
                                                "totalElements": 100,
                                                "totalPages": 10,
                                                "number": 0,
                                                "size": 10
                                              }
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<Page<MemberResponseDto>>> getAllMembers(
            @Parameter(description = "Pencarian berdasarkan nama/plat") @RequestParam(required = false) String search,
            Pageable pageable) {

        Page<MemberResponseDto> members = memberService.findAll(search, pageable);
        return ResponseEntity.ok(com.parkee.parkingpos.dto.ApiResponse.success("Data member berhasil diambil", members));
    }

    /**
     * Get member by ID
     */
    @GetMapping("/members/{id}")
    @Operation(
            summary = "Detail member",
            description = "Mendapatkan detail member berdasarkan ID"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Data member ditemukan",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Member tidak ditemukan",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "message": "Member dengan ID 1001 tidak ditemukan",
                                              "data": null
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<MemberResponseDto>> getMemberById(@PathVariable Long id) {
        MemberResponseDto member = memberService.findById(id);
        return ResponseEntity.ok(com.parkee.parkingpos.dto.ApiResponse.success("Data member ditemukan", member));
    }

    /**
     * Update member
     */
    @PutMapping("/members/{id}")
    @Operation(
            summary = "Update member",
            description = "Mengupdate data member seperti nama, email, phone, atau nomor plat kendaraan"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Update member berhasil",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Member tidak ditemukan",
                    content = @Content(mediaType = "application/json")
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Data tidak valid",
                    content = @Content(mediaType = "application/json")
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<MemberResponseDto>> updateMember(
            @PathVariable Long id,
            @Valid @RequestBody MemberUpdateDto request) {

        MemberResponseDto member = memberService.update(id, request);
        return ResponseEntity.ok(com.parkee.parkingpos.dto.ApiResponse.success("Update member berhasil", member));
    }

    /**
     * Delete/Deactivate member
     */
    @DeleteMapping("/members/{id}")
    @Operation(
            summary = "Hapus member",
            description = "Menonaktifkan member. Member tidak akan dihapus dari database tetapi status akan menjadi tidak aktif."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Member berhasil dinonaktifkan",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Member berhasil dinonaktifkan",
                                              "data": null
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Member tidak ditemukan",
                    content = @Content(mediaType = "application/json")
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<Void>> deleteMember(@PathVariable Long id) {
        memberService.delete(id);
        return ResponseEntity.ok(com.parkee.parkingpos.dto.ApiResponse.success("Member berhasil dinonaktifkan", null));
    }

    /**
     * Top up saldo member
     */
    @PostMapping("/members/{id}/topup")
    @Operation(
            summary = "Top up saldo",
            description = "Menambah saldo member untuk pembayaran non-tunai"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Top up berhasil",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Top up berhasil",
                                              "data": {
                                                "memberId": 1001,
                                                "memberCode": "MBR-1001",
                                                "name": "John Doe",
                                                "previousBalance": 50000,
                                                "topUpAmount": 100000,
                                                "currentBalance": 150000,
                                                "transactionDate": "2025-01-16T14:30:00"
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Member tidak ditemukan",
                    content = @Content(mediaType = "application/json")
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Jumlah top up tidak valid",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "message": "Minimal top up adalah Rp 10.000",
                                              "data": null
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<MemberResponseDto>> topUpBalance(
            @PathVariable Long id,
            @Valid @RequestBody TopUpRequestDto request) {

        MemberResponseDto member = memberService.topUpBalance(id, request.getAmount());
        return ResponseEntity.ok(com.parkee.parkingpos.dto.ApiResponse.success("Top up berhasil", member));
    }

    // ======================== VOUCHER ENDPOINTS ========================

    /**
     * Create voucher baru
     */
    @PostMapping("/vouchers")
    @Operation(
            summary = "Buat voucher",
            description = "Membuat voucher diskon baru dengan berbagai tipe (persentase atau nominal)"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Voucher berhasil dibuat",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Voucher berhasil dibuat",
                                              "data": {
                                                "voucherId": 1,
                                                "voucherCode": "DISC20",
                                                "description": "Diskon 20% untuk semua kendaraan",
                                                "discountType": "PERCENTAGE",
                                                "discountValue": 20,
                                                "maxDiscount": 50000,
                                                "minPurchase": 10000,
                                                "validFrom": "2025-01-16",
                                                "validUntil": "2025-02-16",
                                                "usageLimit": 100,
                                                "usageCount": 0,
                                                "isActive": true
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Data voucher tidak valid atau kode voucher sudah ada",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "message": "Kode voucher DISC20 sudah digunakan",
                                              "data": null
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<VoucherResponseDto>> createVoucher(
            @Valid @RequestBody VoucherCreateDto request) {

        VoucherResponseDto voucher = voucherService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(com.parkee.parkingpos.dto.ApiResponse.success("Voucher berhasil dibuat", voucher));
    }

    /**
     * Get all vouchers
     */
    @GetMapping("/vouchers")
    @Operation(
            summary = "List voucher",
            description = "Mendapatkan daftar voucher dengan opsi filter voucher aktif saja"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Data voucher berhasil diambil",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Data voucher berhasil diambil",
                                              "data": {
                                                "content": [
                                                  {
                                                    "voucherId": 1,
                                                    "voucherCode": "DISC20",
                                                    "description": "Diskon 20%",
                                                    "discountType": "PERCENTAGE",
                                                    "discountValue": 20,
                                                    "validUntil": "2025-02-16",
                                                    "remainingUsage": 85,
                                                    "isActive": true
                                                  }
                                                ],
                                                "totalElements": 25,
                                                "totalPages": 3,
                                                "number": 0,
                                                "size": 10
                                              }
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<Page<VoucherResponseDto>>> getAllVouchers(
            @RequestParam(required = false) Boolean activeOnly,
            Pageable pageable) {

        Page<VoucherResponseDto> vouchers = voucherService.findAll(activeOnly, pageable);
        return ResponseEntity.ok(com.parkee.parkingpos.dto.ApiResponse.success("Data voucher berhasil diambil", vouchers));
    }

    /**
     * Terminate/Expire voucher
     */
    @PostMapping("/vouchers/{id}/terminate")
    @Operation(
            summary = "Terminate voucher",
            description = "Menonaktifkan voucher sebelum masa berlaku berakhir"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Voucher berhasil diterminasi",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Voucher berhasil diterminasi",
                                              "data": {
                                                "voucherId": 1,
                                                "voucherCode": "DISC20",
                                                "isActive": false,
                                                "terminatedAt": "2025-01-16T15:00:00",
                                                "terminatedBy": "admin"
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Voucher tidak ditemukan",
                    content = @Content(mediaType = "application/json")
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Voucher sudah tidak aktif",
                    content = @Content(mediaType = "application/json")
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<VoucherResponseDto>> terminateVoucher(@PathVariable Long id) {
        VoucherResponseDto voucher = voucherService.terminate(id);
        return ResponseEntity.ok(com.parkee.parkingpos.dto.ApiResponse.success("Voucher berhasil diterminasi", voucher));
    }

    // ======================== DASHBOARD & ADMIN ENDPOINTS ========================

    /**
     * Dashboard statistik
     */
    @GetMapping("/dashboard/statistics")
    @Operation(
            summary = "Dashboard statistik",
            description = "Mendapatkan statistik parkir untuk periode tertentu"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Statistik berhasil diambil",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Statistik berhasil diambil",
                                              "data": {
                                                "period": {
                                                  "startDate": "2025-01-01",
                                                  "endDate": "2025-01-16"
                                                },
                                                "totalVehicles": 1250,
                                                "totalRevenue": 15750000,
                                                "averageDuration": "2.5 jam",
                                                "peakHours": ["08:00-10:00", "17:00-19:00"],
                                                "vehicleTypeBreakdown": {
                                                  "MOBIL": 850,
                                                  "MOTOR": 400
                                                },
                                                "paymentMethodBreakdown": {
                                                  "CASH": 60,
                                                  "MEMBER_BALANCE": 25,
                                                  "DEBIT": 15
                                                }
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Parameter tanggal tidak valid",
                    content = @Content(mediaType = "application/json")
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<DashboardStatisticsDto>> getDashboardStatistics(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {

        DashboardStatisticsDto stats = dashboardService.getStatistics(startDate, endDate);
        return ResponseEntity.ok(com.parkee.parkingpos.dto.ApiResponse.success("Statistik berhasil diambil", stats));
    }

    @GetMapping("/admin/vehicles")
    @Operation(
            summary = "List kendaraan",
            description = "Melihat daftar kendaraan masuk/keluar dengan berbagai filter"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Data kendaraan berhasil diambil",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    value = """
                                        {
                                          "success": true,
                                          "message": "Data kendaraan berhasil diambil",
                                          "data": {
                                            "content": [
                                              {
                                                "ticketNumber": "TKT-20250116-001",
                                                "plateNumber": "B 1234 ABC",
                                                "vehicleType": "MOBIL",
                                                "checkInTime": "2025-01-16T10:30:00",
                                                "checkOutTime": "2025-01-16T13:45:00",
                                                "duration": "3 jam 15 menit",
                                                "totalFee": 12000,
                                                "status": "COMPLETED"
                                              }
                                            ],
                                            "totalElements": 150,
                                            "totalPages": 15,
                                            "number": 0,
                                            "size": 10
                                          }
                                        }
                                        """
                            )
                    )
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<Page<VehicleActivityDto>>> getVehicleActivities(
            @RequestParam(required = false) String plateNumber,
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) String status,
            Pageable pageable) {

        // Clean up parameters - treat empty strings as null
        String cleanPlateNumber = (plateNumber != null && !plateNumber.trim().isEmpty())
                ? plateNumber.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty())
                ? status.trim() : null;

        Page<VehicleActivityDto> activities = parkingService.getVehicleActivities(
                cleanPlateNumber, date, cleanStatus, pageable);
        return ResponseEntity.ok(com.parkee.parkingpos.dto.ApiResponse.success("Data kendaraan berhasil diambil", activities));
    }

    /**
     * Admin - Export laporan
     */
    @GetMapping("/admin/reports/export")
    @Operation(
            summary = "Export laporan",
            description = "Export laporan parkir dalam format PDF atau Excel"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Laporan berhasil di-export",
                    content = @Content(
                            mediaType = "application/octet-stream",
                            schema = @Schema(type = "string", format = "binary")
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Parameter tidak valid atau periode terlalu panjang",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "message": "Maksimal periode export adalah 3 bulan",
                                              "data": null
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<byte[]> exportReport(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestParam(defaultValue = "PDF") String format) {

        byte[] report = dashboardService.generateReport(startDate, endDate, format);

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=parking-report." + format.toLowerCase())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(report);
    }

    /**
     * Get payment methods
     */
    @GetMapping("/payment-methods")
    @Operation(
            summary = "Metode pembayaran",
            description = "Mendapatkan daftar metode pembayaran yang tersedia"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Metode pembayaran tersedia",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Metode pembayaran tersedia",
                                              "data": [
                                                {
                                                  "code": "CASH",
                                                  "name": "Tunai",
                                                  "description": "Pembayaran tunai",
                                                  "isActive": true
                                                },
                                                {
                                                  "code": "MEMBER_BALANCE",
                                                  "name": "Saldo Member",
                                                  "description": "Pembayaran menggunakan saldo member",
                                                  "isActive": true
                                                },
                                                {
                                                  "code": "DEBIT",
                                                  "name": "Kartu Debit",
                                                  "description": "Pembayaran dengan kartu debit",
                                                  "isActive": true
                                                }
                                              ]
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<List<PaymentMethodDto>>> getPaymentMethods() {
        List<PaymentMethodDto> methods = parkingService.getAvailablePaymentMethods();
        return ResponseEntity.ok(com.parkee.parkingpos.dto.ApiResponse.success("Metode pembayaran tersedia", methods));
    }

    /**
     * Get invoice by ID
     */
    @GetMapping("/invoices/{invoiceNumber}")
    @Operation(
            summary = "Detail invoice",
            description = "Mendapatkan detail invoice berdasarkan nomor invoice"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Invoice ditemukan",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Invoice ditemukan",
                                              "data": {
                                                "invoiceNumber": "INV-20250116-0001",
                                                "ticketNumber": "TKT-20250116-001",
                                                "plateNumber": "B 1234 ABC",
                                                "vehicleType": "MOBIL",
                                                "checkInTime": "2025-01-16T10:30:00",
                                                "checkOutTime": "2025-01-16T13:45:00",
                                                "duration": "3 jam 15 menit",
                                                "baseFee": 12000,
                                                "discount": 0,
                                                "totalFee": 12000,
                                                "paymentMethod": "CASH",
                                                "paymentTime": "2025-01-16T13:46:30",
                                                "cashierName": "Admin POS 1"
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Invoice tidak ditemukan",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "message": "Invoice dengan nomor INV-20250116-0001 tidak ditemukan",
                                              "data": null
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<InvoiceReceiptDto>> getInvoice(@PathVariable String invoiceNumber) {
        InvoiceReceiptDto invoice = invoiceReceiptService.findByInvoiceNumber(invoiceNumber);
        return ResponseEntity.ok(com.parkee.parkingpos.dto.ApiResponse.success("Invoice ditemukan", invoice));
    }

    /**
     * Health check untuk monitoring
     */
    @GetMapping("/health")
    @Operation(
            summary = "Health check",
            description = "Cek status aplikasi untuk monitoring dan load balancer"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Aplikasi berjalan normal",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "status": "UP",
                                              "service": "Parking POS API",
                                              "version": "1.0.0",
                                              "timestamp": "2025-01-16T15:30:00",
                                              "uptime": "5 days 3 hours"
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Service tidak tersedia",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "status": "DOWN",
                                              "service": "Parking POS API",
                                              "version": "1.0.0",
                                              "error": "Database connection failed"
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Parking POS API",
                "version", "1.0.0"
        ));
    }
}