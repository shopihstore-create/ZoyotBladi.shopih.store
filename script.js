const offerSelect = document.querySelector('#offer-select');
const orderForm = document.querySelector('#cod-form');
const successBox = document.querySelector('#form-success');

document.querySelectorAll('.choose-offer').forEach((button) => {
  button.addEventListener('click', () => {
    if (offerSelect) {
      offerSelect.value = button.dataset.offer || '';
      document.querySelector('#order')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => document.querySelector('input[name="name"]')?.focus(), 550);
    }
  });
});

orderForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!orderForm.checkValidity()) {
    orderForm.reportValidity();
    return;
  }
  if (successBox) {
    successBox.style.display = 'block';
    successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});

document.querySelectorAll('.faq-list details').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    if (detail.open) {
      document.querySelectorAll('.faq-list details').forEach((other) => {
        if (other !== detail) other.removeAttribute('open');
      });
    }
  });
});
