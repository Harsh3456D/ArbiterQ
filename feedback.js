const form = document.getElementById('contactform');
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            const data = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value
            };

            try {
                // Send the form data to your Python backend
                const response = await fetch('http://localhost:5000/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();

                if (response.ok) {
                    alert('Thank you for your feedback! It has been sent.');
                    form.reset();
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                alert('An error occurred. Could not connect to the server.');
            }
        });