const selectors = {
  shippingCountrySelect: '[name="shipping_address[country]"]',
  shippingCountrySelectId: 'ShippingEstimateCountry',
  shippingProvinceSelectId: 'ShippingEstimateProvince',
  shippingProvinceSelect: '[name="shipping_address[province]"]',
  shippingZipInput: '[name="shipping_address[zip]"]',
  shippingSubmitButton: 'button[type="button"]',
  shippingProvinceContainer: 'ShippingProvinceContainer',
  shippingRatesContainer: '.shipping-rates__results'

}


class ShippingRatesEstimator extends HTMLElement {
  constructor() {
    super();
    this.shippingEstimateForm = this.querySelector('form');
    this.provinceContainer = this.querySelector(selectors.shippingProvinceContainer);
    this.countrySelect = this.querySelector(selectors.shippingCountrySelect);
    this.provinceSelect = this.querySelector(selectors.shippingProvinceSelect);
    this.zipInput = this.querySelector(selectors.shippingZipInput);
    this.submitButton = this.querySelector(selectors.shippingSubmitButton);

    this.submitButton.addEventListener('click', this.onPrepareShipping.bind(this));

    this.setupShippingSelectors();
  }

  setupShippingSelectors() {
    if (Shopify && Shopify.CountryProvinceSelector) {
      console.log("init shipping selectors");
      new Shopify.CountryProvinceSelector(selectors.shippingCountrySelectId, selectors.shippingProvinceSelectId, {
        hideElement: selectors.shippingProvinceContainer
      });
    }
  }

  onShippingAddressChange(event) {
    console.log(event);
    const formData = new FormData();
    formData.append(this.countrySelect.name, this.countrySelect.value);
    formData.append(this.provinceSelect.name, this.provinceSelect.value);
    formData.append(this.zipInput.name, this.zipInput.value);
    console.log(formData);
    console.log(this.countrySelect.value, this.provinceSelect.value, this.zipInput.value);
    this.submitButton.disabled = this.canSubmit(formData);

  }



  canSubmit(formData) {
    const formKeys = ['shipping_address[country]', 'shipping_address[province]', 'shipping_address[zip]'];
    for (const key in formKeys) {
      const value = formData.get(key);
      console.log(value);
      if (!value || value === '') {
        return false;
      }
    }
    return true;
  }

  onPrepareShipping(event) {
    event.preventDefault();
    const formData = new FormData(this.shippingEstimateForm);

    if (true) {
      this.submitButton.classList.add('loading');
      this.submitButton.setAttribute('disabled', true);
      const shippingAddress = {
        shipping_address: {
          zip: this.zipInput.value,
          country: this.countrySelect.value,
          province: this.provinceSelect.value
        }
      };
      const body = JSON.stringify(shippingAddress);
      fetch(`${window.Shopify.routes.root}cart/prepare_shipping_rates.json`, {...fetchConfig('javascript'), body })
        .then(response => {
          console.log(response);
          if (response.ok) {
            this.fetchShippingRates(shippingAddress.shipping_address);
          }
        })
        .catch((e) => {
          console.log(e);
        })
    }
  }

  fetchShippingRates({ country, province, zip}) {

    fetch(`${window.Shopify.routes.root}cart/async_shipping_rates.json?${encodeURIComponent('shipping_address[zip]')}=${zip}&${encodeURIComponent('shipping_address[country]')}=${country}&${encodeURIComponent('shipping_address[province]')}=${province}`)
      .then(response => response.json())
      .then(response => {
        console.log(response);
        this.renderShippingRates(response);
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        this.submitButton.classList.remove('loading');
        this.submitButton.removeAttribute('disabled');
      });

  }

  renderShippingRates(results) {
    const resultsContainer = this.querySelector(selectors.shippingRatesContainer);
    if (results && results.shipping_rates) {
      const shippingRates = results.shipping_rates;
      if (shippingRates.length === 0) {
        resultsContainer.innerHTML = '<p>There are no available shipping rates</p>';
      } else {
        if (shippingRates.length === 1) {
          resultsContainer.innerHTML = '<p>There is one available shipping rate</p>';
        } else {
          const headerHtml = `<p>There are ${shippingRates.length} available shipping rates<p>`;
          resultsContainer.innerHTML = headerHtml;
        }

        const resultsList = document.createElement('ul');
        shippingRates.forEach((rate) => {
          const child = document.createElement('li');
          child.innerHTML = `${rate.name}: ${rate.price} ${rate.currency}`;
          resultsList.append(child);
        })
        resultsContainer.append(resultsList);
      }
    } else {
      resultsContainer.innerHTML = '<p>Unable to fetch shipping rates at this time</p>';
    }
  }
}

customElements.define('shipping-rates-estimator', ShippingRatesEstimator);