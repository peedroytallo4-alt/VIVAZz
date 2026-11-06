const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.topbar nav');

menuToggle.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    navigation.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
  }
});

const cart = [];
const shippingFee = 18.9;
let hasRegistrationDiscount = false;
let shippingCost = null;
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const cartItems = document.querySelector('#cart-items');
const cartCount = document.querySelector('#cart-count');
const subtotalElement = document.querySelector('#subtotal');
const discountRow = document.querySelector('#discount-row');
const discountTotal = document.querySelector('#discount-total');
const pixDiscountRow = document.querySelector('#pix-discount-row');
const pixDiscountTotal = document.querySelector('#pix-discount-total');
const shippingTotal = document.querySelector('#shipping-total');
const grandTotal = document.querySelector('#grand-total');
const checkoutMessage = document.querySelector('#checkout-message');

function updateOrder() {
  cartItems.replaceChildren();

  if (cart.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.className = 'empty-cart';
    emptyMessage.textContent = 'Seu carrinho está esperando por você.';
    cartItems.append(emptyMessage);
  } else {
    cart.forEach((item, index) => {
      const row = document.createElement('li');
      const description = document.createElement('span');
      description.textContent = `${item.name} × ${item.quantity} · ${currency.format(item.price * item.quantity)}`;
      const removeButton = document.createElement('button');
      removeButton.className = 'remove-item';
      removeButton.type = 'button';
      removeButton.dataset.removeIndex = String(index);
      removeButton.textContent = 'Remover';
      row.append(description, removeButton);
      cartItems.append(row);
    });
  }

  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const registrationSavings = hasRegistrationDiscount ? subtotal * 0.1 : 0;
  const isPix = document.querySelector('input[name="payment"]:checked').value === 'Pix';
  const pixSavings = isPix ? (subtotal - registrationSavings) * 0.05 : 0;
  const total = Math.max(0, subtotal - registrationSavings - pixSavings + (shippingCost ?? 0));

  cartCount.textContent = `(${quantity})`;
  subtotalElement.textContent = currency.format(subtotal);
  discountRow.hidden = !hasRegistrationDiscount || subtotal === 0;
  discountTotal.textContent = `− ${currency.format(registrationSavings)}`;
  pixDiscountRow.hidden = !isPix || subtotal === 0;
  pixDiscountTotal.textContent = `− ${currency.format(pixSavings)}`;
  shippingTotal.textContent = shippingCost === null ? 'Calcule abaixo' : shippingCost === 0 ? 'Grátis' : currency.format(shippingCost);
  grandTotal.textContent = currency.format(total);
}

document.querySelectorAll('.add-to-cart').forEach((button) => {
  button.addEventListener('click', () => {
    const existingItem = cart.find((item) => item.name === button.dataset.product);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ name: button.dataset.product, price: Number(button.dataset.price), quantity: 1 });
    }
    checkoutMessage.textContent = `${button.dataset.product} adicionado ao carrinho.`;
    updateOrder();
  });
});

cartItems.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove-index]');
  if (!removeButton) return;

  const index = Number(removeButton.dataset.removeIndex);
  if (cart[index].quantity > 1) {
    cart[index].quantity -= 1;
  } else {
    cart.splice(index, 1);
  }
  updateOrder();
});

document.querySelector('#signup-form').addEventListener('submit', (event) => {
  event.preventDefault();
  hasRegistrationDiscount = true;
  const firstName = document.querySelector('#signup-name').value.trim().split(/\s+/)[0];
  const message = document.querySelector('#signup-message');
  message.textContent = `Tudo certo, ${firstName}! Seu desconto de 10% foi aplicado ao pedido.`;
  message.classList.add('success');
  updateOrder();
});

document.querySelector('#delivery-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const city = document.querySelector('#delivery-city').value
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
  const state = document.querySelector('#delivery-state').value.trim().toUpperCase();
  const isSaoPauloMunicipality = city === 'sao paulo' && state === 'SP';
  shippingCost = isSaoPauloMunicipality ? 0 : shippingFee;

  const message = document.querySelector('#delivery-message');
  message.textContent = isSaoPauloMunicipality
    ? 'Boa notícia: entregamos sem custo em todo o município de São Paulo (SP).'
    : `Para esta região, a taxa de entrega é ${currency.format(shippingFee)}.`;
  message.classList.add('success');
  updateOrder();
});

document.querySelectorAll('input[name="payment"]').forEach((radio) => {
  radio.addEventListener('change', updateOrder);
});

document.querySelector('#checkout-button').addEventListener('click', () => {
  if (cart.length === 0) {
    checkoutMessage.textContent = 'Adicione uma peça ao carrinho antes de finalizar.';
    return;
  }
  if (shippingCost === null) {
    checkoutMessage.textContent = 'Informe sua cidade e estado para calcular a entrega.';
    document.querySelector('#delivery-city').focus();
    return;
  }
  const payment = document.querySelector('input[name="payment"]:checked').value;
  checkoutMessage.textContent = `Pedido preparado para pagamento via ${payment}. Este checkout é demonstrativo e não processa pagamentos.`;
});

updateOrder();
