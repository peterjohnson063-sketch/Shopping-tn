import 'dart:async';

import 'package:geolocator/geolocator.dart';

class LocationService {
  Future<void> ensurePermission() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever ||
        permission == LocationPermission.denied) {
      throw Exception('Location permission denied');
    }
  }

  StreamSubscription<Position> watchLocation(void Function(Position) onData) {
    return Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: 30,
      ),
    ).listen(onData);
  }
}
