document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('booking-form');
    const confirmationMessage = document.getElementById('confirmation-message');
    const customerNameDisplay = document.getElementById('customer-name');
    const bookedServiceDisplay = document.getElementById('booked-service');
    const bookedDateDisplay = document.getElementById('booked-date');
    const bookedTimeDisplay = document.getElementById('booked-time');

    bookingForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        const name = document.getElementById('name').value;
        const service = document.getElementById('service').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;

        // Display the confirmation message
        customerNameDisplay.textContent = name;
        bookedServiceDisplay.textContent = service;
        bookedDateDisplay.textContent = date;
        bookedTimeDisplay.textContent = time;
        confirmationMessage.classList.remove('hidden');

        // Optionally, you could clear the form here
        bookingForm.reset();
    });
});