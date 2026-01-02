// Contact Modal
const contactBtn = document.getElementById('contact-btn');
const contactModal = document.getElementById('contact-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const copyEmailBtn = document.getElementById('copy-email-btn');
const emailDisplay = document.getElementById('email-display');

contactBtn.addEventListener('click', () => {
    contactModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
    contactModal.style.display = 'none';
});

contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) {
        contactModal.style.display = 'none';
    }
});

copyEmailBtn.addEventListener('click', () => {
    const email = emailDisplay.textContent;
    navigator.clipboard.writeText(email).then(() => {
        copyEmailBtn.textContent = 'Copied!';
        copyEmailBtn.classList.add('copied');
        setTimeout(() => {
            copyEmailBtn.textContent = 'Copy Email';
            copyEmailBtn.classList.remove('copied');
        }, 2000);
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactModal.style.display === 'flex') {
        contactModal.style.display = 'none';
    }
});
