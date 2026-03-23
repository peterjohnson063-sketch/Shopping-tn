class DeliveryOrder {
  const DeliveryOrder({
    required this.id,
    required this.trackingNumber,
    required this.status,
    required this.customerName,
    required this.phone,
    required this.wilaya,
    required this.address,
    required this.total,
    required this.itemsLabel,
    this.vendorLat,
    this.vendorLng,
    this.deliveryLat,
    this.deliveryLng,
  });

  final String id;
  final String trackingNumber;
  final String status;
  final String customerName;
  final String phone;
  final String wilaya;
  final String address;
  final double total;
  final String itemsLabel;
  final double? vendorLat;
  final double? vendorLng;
  final double? deliveryLat;
  final double? deliveryLng;

  factory DeliveryOrder.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List?) ?? const [];
    final itemNames = items
        .map((e) => (e as Map<String, dynamic>)['name']?.toString() ?? 'Item')
        .toList();

    double? toDouble(dynamic v) {
      if (v == null) return null;
      if (v is num) return v.toDouble();
      return double.tryParse(v.toString());
    }

    return DeliveryOrder(
      id: (json['id'] ?? '').toString(),
      trackingNumber: (json['tracking_number'] ?? json['id'] ?? '').toString(),
      status: (json['status'] ?? 'pending').toString(),
      customerName: (json['client_name'] ?? json['notes'] ?? 'Customer').toString(),
      phone: (json['phone'] ?? '').toString(),
      wilaya: (json['wilaya'] ?? '').toString(),
      address: (json['address'] ?? '').toString(),
      total: (json['total'] is num)
          ? (json['total'] as num).toDouble()
          : double.tryParse((json['total'] ?? '0').toString()) ?? 0,
      itemsLabel: itemNames.isEmpty ? 'Items not specified' : itemNames.join(', '),
      vendorLat: toDouble(json['vendor_lat'] ?? json['pickup_lat']),
      vendorLng: toDouble(json['vendor_lng'] ?? json['pickup_lng']),
      deliveryLat: toDouble(json['delivery_lat'] ?? json['customer_lat']),
      deliveryLng: toDouble(json['delivery_lng'] ?? json['customer_lng']),
    );
  }
}
