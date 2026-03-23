import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/delivery_order.dart';

class SupabaseService {
  SupabaseClient get _db => Supabase.instance.client;

  Future<Map<String, dynamic>?> loginDriver({
    required String email,
    required String password,
  }) async {
    final rows = await _db
        .from('users')
        .select()
        .eq('email', email)
        .limit(1);
    if (rows.isEmpty) return null;
    final user = rows.first as Map<String, dynamic>;
    if ((user['password'] ?? '').toString() != password) return null;
    if ((user['role'] ?? '').toString() != 'driver') return null;
    return user;
  }

  Future<List<DeliveryOrder>> getDriverOrders(String driverId) async {
    final rows = await _db
        .from('orders')
        .select()
        .eq('driver_id', driverId)
        .order('created_at', ascending: false);
    return rows
        .cast<Map<String, dynamic>>()
        .map(DeliveryOrder.fromJson)
        .toList();
  }

  Future<void> patchOrder(String orderId, Map<String, dynamic> body) async {
    await _db.from('orders').update(body).eq('id', orderId);
  }

  Future<void> addTracking({
    required String orderId,
    required String status,
    required String message,
    String? location,
  }) async {
    await _db.from('order_tracking').insert({
      'order_id': orderId,
      'status': status,
      'message': message,
      'location': location,
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<void> updateLiveLocation({
    required String orderId,
    required double lat,
    required double lng,
  }) async {
    await _db.from('orders').update({
      'driver_lat': lat,
      'driver_lng': lng,
    }).eq('id', orderId);
  }
}
