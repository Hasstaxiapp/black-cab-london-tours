
document.addEventListener('DOMContentLoaded', function () {
  const rideType = document.getElementById('ride-type');
  const flightField = document.getElementById('flight-number-field');
  const pickup = document.getElementById('pickup');
  const dropoff = document.getElementById('dropoff');
  const fareDisplay = document.getElementById('fare');

  rideType.addEventListener('change', () => {
    if (rideType.value === 'airport') {
      flightField.style.display = 'block';
    } else {
      flightField.style.display = 'none';
    }
  });

  document.getElementById('booking-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const baseFare = 6 + 4.2;
    const perMile = 5.5;
    const isAirport = rideType.value === 'airport';

    // Simulated distance for now
    const simulatedMiles = 10; // Replace with Google Maps API call later
    let fare = isAirport ? (baseFare + perMile * simulatedMiles) : 75;
    fareDisplay.textContent = `£${fare.toFixed(2)}`;

    // Simulate redirecting to payment (placeholder)
    alert("Proceeding to payment...");
  });
});
