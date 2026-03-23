import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import '../models/delivery_order.dart';
import '../services/location_service.dart';
import '../services/supabase_service.dart';

class DriverSession extends ChangeNotifier {
  DriverSession({
    required SupabaseService api,
    required LocationService locationService,
  })  : _api = api,
        _locationService = locationService;

  final SupabaseService _api;
  final LocationService _locationService;

  Map<String, dynamic>? currentDriver;
  List<DeliveryOrder> orders = const [];
  bool loading = false;
  StreamSubscription<Position>? _gpsSub;
  String? _activeGpsOrderId;

  bool get isLoggedIn => currentDriver != null;

  Future<bool> login(String email, String password) async {
    loading = true;
    notifyListeners();
    try {
      final user = await _api.loginDriver(email: email, password: password);
      currentDriver = user;
      if (user == null) return false;
      await refreshOrders();
      return true;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> refreshOrders() async {
    final id = currentDriver?['id']?.toString();
    if (id == null || id.isEmpty) return;
    orders = await _api.getDriverOrders(id);
    notifyListeners();
  }

  Future<void> markOutForDelivery(DeliveryOrder order) async {
    await _api.patchOrder(order.id, {'status': 'out_for_delivery'});
    await _api.addTracking(
      orderId: order.id,
      status: 'out_for_delivery',
      message: 'Driver is heading to destination',
    );
    await refreshOrders();
  }

  Future<void> markDelivered(DeliveryOrder order, String note) async {
    await _api.patchOrder(order.id, {
      'status': 'delivered',
      'delivered_at': DateTime.now().toIso8601String(),
      'pod_note': note.isEmpty ? null : note,
    });
    await _api.addTracking(
      orderId: order.id,
      status: 'delivered',
      message: 'Order delivered to customer',
    );
    await stopGps();
    await refreshOrders();
  }

  Future<void> startGps(DeliveryOrder order) async {
    await _locationService.ensurePermission();
    _activeGpsOrderId = order.id;
    _gpsSub?.cancel();
    _gpsSub = _locationService.watchLocation((pos) {
      final id = _activeGpsOrderId;
      if (id == null) return;
      _api.updateLiveLocation(orderId: id, lat: pos.latitude, lng: pos.longitude);
    });
  }

  Future<void> stopGps() async {
    _activeGpsOrderId = null;
    await _gpsSub?.cancel();
    _gpsSub = null;
  }

  @override
  Future<void> dispose() async {
    await _gpsSub?.cancel();
    super.dispose();
  }
}
