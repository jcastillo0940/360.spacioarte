define(["jquery"], function ($) {
  "use strict";

  return function () {
    var self = this;
    var state = {
      context: null,
      matchedContact: null,
      invoices: [],
      quotes: [],
      order: null,
      shareResult: null,
      oauthStatus: null,
      error: null,
      loading: false,
      syncing: false,
    };

    function widgetCode() {
      return (self.get_settings() && self.get_settings().widget_code) || "spacioarte_widget";
    }

    function getWidgetSettings() {
      var params = self.params || {};
      var settings = self.get_settings ? self.get_settings() : {};

      return {
        apiBaseUrl: (params.api_base_url || settings.api_base_url || "").replace(/\/+$/, ""),
        integrationKey: params.integration_key || settings.integration_key || "",
        defaultOrderPrefix: params.default_order_prefix || settings.default_order_prefix || "OV-",
      };
    }

    function authHeaders() {
      var settings = getWidgetSettings();

      return {
        Authorization: "Bearer " + settings.integrationKey,
        Accept: "application/json",
      };
    }

    function apiUrl(path) {
      return getWidgetSettings().apiBaseUrl + path;
    }

    function safeText(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function money(value) {
      var amount = parseFloat(value || 0);

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(amount);
    }

    function shortDate(value) {
      if (!value) {
        return "N/A";
      }

      try {
        return new Date(value).toLocaleDateString();
      } catch (e) {
        return value;
      }
    }

    function root() {
      return $(".spacioarte-kommo-root");
    }

    function setLoading(flag) {
      state.loading = !!flag;
      renderWidget();
    }

    function setError(message) {
      state.error = message || null;
      renderWidget();
    }

    function clearError() {
      state.error = null;
    }

    function currentCard() {
      return (window.APP && APP.data && APP.data.current_card) || null;
    }

    function currentCardModelAttributes() {
      var card = currentCard();
      var model = card && card.model;

      return (model && model.attributes) || {};
    }

    function currentEntityType() {
      if (window.APP && typeof APP.getBaseEntity === "function") {
        return APP.getBaseEntity();
      }

      return (self.system && self.system().area) || "unknown";
    }

    function currentAccountSubdomain() {
      if (typeof APP !== "undefined" && APP.constant) {
        var account = APP.constant("account") || {};
        if (account.subdomain) {
          return account.subdomain;
        }
      }

      return "";
    }

    function cardTitle() {
      var attrs = currentCardModelAttributes();

      return attrs.name || attrs.title || attrs.company_name || "Kommo card";
    }

    function firstValue(list) {
      if (!$.isArray(list) || !list.length) {
        return "";
      }

      var value = list[0];

      if ($.isPlainObject(value)) {
        return value.value || value.name || "";
      }

      return value || "";
    }

    function normalizeContactCandidate(item) {
      item = item || {};

      return {
        id: item.id || null,
        name: item.name || item.first_name || item.last_name || "",
        phone: firstValue(item.phones),
        email: firstValue(item.emails),
      };
    }

    function request(method, path, payload) {
      return $.ajax({
        url: apiUrl(path),
        method: method,
        headers: authHeaders(),
        dataType: "json",
        contentType: method === "GET" ? undefined : "application/json",
        data: method === "GET" ? payload : JSON.stringify(payload || {}),
        crossDomain: true,
      });
    }

    function resolveCardContacts() {
      if (typeof self.get_current_card_contacts_data === "function") {
        return self.get_current_card_contacts_data()
          .then(function (contacts) {
            return $.map(contacts || [], normalizeContactCandidate);
          })
          .catch(function () {
            return fallbackCardContacts();
          });
      }

      return $.Deferred().resolve(fallbackCardContacts()).promise();
    }

    function fallbackCardContacts() {
      var attrs = currentCardModelAttributes();

      return [
        normalizeContactCandidate({
          id: currentCard() ? currentCard().id : null,
          name: attrs.name || "",
          phones: attrs.phones || attrs.phone || [],
          emails: attrs.emails || attrs.email || [],
        }),
      ];
    }

    function searchContactInErp(candidate) {
      if (!candidate) {
        return $.Deferred().resolve([]).promise();
      }

      if (candidate.phone) {
        return request("GET", "/api/integrations/kommo/contacts/search", { phone: candidate.phone });
      }

      if (candidate.email) {
        return request("GET", "/api/integrations/kommo/contacts/search", { email: candidate.email });
      }

      if (candidate.name) {
        return request("GET", "/api/integrations/kommo/contacts/search", { query: candidate.name });
      }

      return $.Deferred().resolve({ data: [] }).promise();
    }

    function loadCustomerData(contactId) {
      return $.when(
        request("GET", "/api/integrations/kommo/invoices/by-contact/" + contactId),
        request("GET", "/api/integrations/kommo/quotes/by-contact/" + contactId)
      ).then(function (invoicesResponse, quotesResponse) {
        var invoicesPayload = invoicesResponse[0] || {};
        var quotesPayload = quotesResponse[0] || {};

        state.invoices = invoicesPayload.data || [];
        state.quotes = quotesPayload.data || [];
        renderWidget();
      });
    }

    function autoMatchContact() {
      var contacts = (state.context && state.context.contacts) || [];

      if (!contacts.length) {
        renderWidget();
        return $.Deferred().resolve().promise();
      }

      var chain = $.Deferred().resolve({ data: [] }).promise();

      $.each(contacts, function (_, candidate) {
        chain = chain.then(function (response) {
          if (response && response.data && response.data.length) {
            return response;
          }

          return searchContactInErp(candidate);
        });
      });

      return chain.then(function (response) {
        var matches = (response && response.data) || [];

        if (matches.length) {
          state.matchedContact = matches[0];
          return loadCustomerData(state.matchedContact.id);
        }

        renderWidget();
        return null;
      });
    }

    function buildSyncPayload() {
      var attrs = currentCardModelAttributes();
      var contacts = (state.context && state.context.contacts) || [];
      var primary = contacts[0] || {};
      var entityType = state.context ? state.context.entityType : currentEntityType();

      if (entityType === "leads") {
        return {
          path: "/api/integrations/kommo/leads/sync",
          payload: {
            kommo_lead_id: String(state.context.entityId),
            kommo_contact_id: primary.id ? String(primary.id) : null,
            title: attrs.name || cardTitle(),
            company_name: primary.name || attrs.name || null,
            contact_name: primary.name || attrs.name || null,
            email: primary.email || "",
            phone: primary.phone || "",
            expected_value: attrs.price || 0,
            notes: "Synchronized from Kommo private widget.",
          },
        };
      }

      return {
        path: "/api/integrations/kommo/contacts/sync",
        payload: {
          kommo_contact_id: String(state.context.entityId),
          name: attrs.name || primary.name || cardTitle(),
          company_name: attrs.name || primary.name || cardTitle(),
          contact_name: attrs.name || primary.name || cardTitle(),
          email: primary.email || attrs.email || "",
          phone: primary.phone || attrs.phone || "",
        },
      };
    }

    function syncCurrentCard() {
      var config = buildSyncPayload();
      state.syncing = true;
      clearError();
      renderWidget();

      return request("POST", config.path, config.payload)
        .then(function (response) {
          if (response && response.contact) {
            state.matchedContact = response.contact;
            return loadCustomerData(response.contact.id);
          }

          renderWidget();
          return null;
        })
        .fail(function (xhr) {
          setError(extractXhrError(xhr, "Could not sync the current Kommo card."));
        })
        .always(function () {
          state.syncing = false;
          renderWidget();
        });
    }

    function lookupOrder(orderNumber) {
      clearError();
      state.order = null;
      setLoading(true);

      return request("GET", "/api/integrations/kommo/orders/" + encodeURIComponent(orderNumber))
        .then(function (response) {
          state.order = response.data || null;
          renderWidget();
        })
        .fail(function (xhr) {
          setError(extractXhrError(xhr, "Order not found in the ERP."));
        })
        .always(function () {
          setLoading(false);
        });
    }

    function shareInvoice(invoiceId) {
      clearError();

      return request("POST", "/api/integrations/kommo/invoices/" + invoiceId + "/share-whatsapp", {})
        .then(function (response) {
          state.shareResult = response.share || null;
          renderWidget();
        })
        .fail(function (xhr) {
          setError(extractXhrError(xhr, "Could not generate the WhatsApp share link."));
        });
    }

    function extractXhrError(xhr, fallback) {
      if (xhr && xhr.responseJSON) {
        return xhr.responseJSON.message || fallback;
      }

      return fallback;
    }

    function initialLoad() {
      var card = currentCard();
      var entityType = currentEntityType();

      if (!card || !card.id || card.id === 0) {
        renderWidget();
        return;
      }

      state.context = {
        entityId: card.id,
        entityType: entityType,
        title: cardTitle(),
        contacts: [],
      };

      setLoading(true);

      $.when(fetchOAuthStatus(), resolveCardContacts())
        .then(function (oauthResponse, contactsResponse) {
          var contacts = contactsResponse;

          if ($.isArray(oauthResponse) && oauthResponse.length) {
            state.oauthStatus = oauthResponse[0];
          } else if ($.isPlainObject(oauthResponse)) {
            state.oauthStatus = oauthResponse;
          }

          if ($.isArray(contactsResponse) && contactsResponse.length && $.isArray(contactsResponse[0])) {
            contacts = contactsResponse[0];
          }

          state.context.contacts = contacts || [];
          return autoMatchContact();
        })
        .fail(function () {
          setError("Could not initialize the ERP or OAuth data for this card.");
        })
        .always(function () {
          setLoading(false);
        });
    }

    function fetchOAuthStatus() {
      var subdomain = currentAccountSubdomain();

      return request("GET", "/api/integrations/kommo/oauth/status", {
        subdomain: subdomain || undefined,
      });
    }

    function widgetBody() {
      var settings = getWidgetSettings();
      var contact = state.matchedContact;
      var contactHtml = contact
        ? (
            '<div class="spacioarte-kommo-card">' +
              '<div class="spacioarte-kommo-card__title">ERP Contact</div>' +
              '<div class="spacioarte-kommo-stat"><span>Name</span><strong>' + safeText(contact.razon_social) + '</strong></div>' +
              '<div class="spacioarte-kommo-stat"><span>Phone</span><strong>' + safeText(contact.telefono || "N/A") + '</strong></div>' +
              '<div class="spacioarte-kommo-stat"><span>Email</span><strong>' + safeText(contact.email || "N/A") + '</strong></div>' +
              '<div class="spacioarte-kommo-stat"><span>Pending balance</span><strong>' + money(contact.saldo_pendiente_facturas) + '</strong></div>' +
            '</div>'
          )
        : (
            '<div class="spacioarte-kommo-card spacioarte-kommo-card--muted">' +
              '<div class="spacioarte-kommo-card__title">ERP Contact</div>' +
              '<p>No ERP contact matched automatically from this Kommo card yet.</p>' +
            '</div>'
          );

      var oauthHtml = state.oauthStatus
        ? (
            '<div class="spacioarte-kommo-card">' +
              '<div class="spacioarte-kommo-card__title">Kommo OAuth</div>' +
              '<div class="spacioarte-kommo-stat"><span>Subdomain</span><strong>' + safeText(state.oauthStatus.subdomain || currentAccountSubdomain() || "N/A") + '</strong></div>' +
              '<div class="spacioarte-kommo-stat"><span>ERP OAuth config</span><strong>' + (state.oauthStatus.configured ? "Ready" : "Missing") + '</strong></div>' +
              '<div class="spacioarte-kommo-stat"><span>Status</span><strong>' + (state.oauthStatus.connected ? "Connected" : "Not connected") + '</strong></div>' +
              (state.oauthStatus.installation && state.oauthStatus.installation.last_authorized_at
                ? '<div class="spacioarte-kommo-stat"><span>Authorized</span><strong>' + safeText(shortDate(state.oauthStatus.installation.last_authorized_at)) + '</strong></div>'
                : '') +
              (!state.oauthStatus.configured
                ? '<div class="spacioarte-kommo-empty">Configure KOMMO_CLIENT_ID, KOMMO_CLIENT_SECRET, and KOMMO_REDIRECT_URI in the ERP first.</div>'
                : '') +
              (!state.oauthStatus.connected && state.oauthStatus.authorization_url
                ? '<a class="spacioarte-kommo-link" href="' + safeText(state.oauthStatus.authorization_url) + '" target="_blank">Connect Kommo account</a>'
                : '') +
            '</div>'
          )
        : "";

      var invoicesHtml = state.invoices.length
        ? $.map(state.invoices.slice(0, 5), function (invoice) {
            return (
              '<div class="spacioarte-kommo-list-item">' +
                '<div>' +
                  '<div class="spacioarte-kommo-list-item__title">' + safeText(invoice.numero_factura) + '</div>' +
                  '<div class="spacioarte-kommo-list-item__meta">' + safeText(invoice.estado) + " • " + money(invoice.total) + '</div>' +
                '</div>' +
                '<button class="spacioarte-kommo-btn spacioarte-kommo-btn--ghost" data-action="share-invoice" data-id="' + safeText(invoice.id) + '">WhatsApp</button>' +
              '</div>'
            );
          }).join("")
        : '<div class="spacioarte-kommo-empty">No invoices available for this ERP contact.</div>';

      var quotesHtml = state.quotes.length
        ? $.map(state.quotes.slice(0, 5), function (quote) {
            return (
              '<div class="spacioarte-kommo-list-item">' +
                '<div>' +
                  '<div class="spacioarte-kommo-list-item__title">' + safeText(quote.numero_cotizacion) + '</div>' +
                  '<div class="spacioarte-kommo-list-item__meta">' + safeText(quote.estado) + " • " + money(quote.total) + '</div>' +
                '</div>' +
              '</div>'
            );
          }).join("")
        : '<div class="spacioarte-kommo-empty">No quotes available for this ERP contact.</div>';

      var orderHtml = state.order
        ? (
            '<div class="spacioarte-kommo-card">' +
              '<div class="spacioarte-kommo-card__title">Order ' + safeText(state.order.numero_orden) + '</div>' +
              '<div class="spacioarte-kommo-stat"><span>Status</span><strong>' + safeText(state.order.estado || "N/A") + '</strong></div>' +
              '<div class="spacioarte-kommo-stat"><span>Design</span><strong>' + safeText(state.order.estado_diseno || "N/A") + '</strong></div>' +
              '<div class="spacioarte-kommo-stat"><span>Delivery</span><strong>' + safeText(shortDate(state.order.fecha_entrega)) + '</strong></div>' +
              '<div class="spacioarte-kommo-stat"><span>Pending</span><strong>' + money(state.order.saldo_pendiente) + '</strong></div>' +
              (state.order.tracking_url ? '<a class="spacioarte-kommo-link" href="' + safeText(state.order.tracking_url) + '" target="_blank">Open tracking portal</a>' : '') +
            '</div>'
          )
        : '<div class="spacioarte-kommo-empty">Lookup an order number to see delivery, balance, and tracking details.</div>';

      var shareHtml = state.shareResult
        ? (
            '<div class="spacioarte-kommo-share">' +
              '<div class="spacioarte-kommo-card__title">WhatsApp Share Ready</div>' +
              '<a class="spacioarte-kommo-link" href="' + safeText(state.shareResult.whatsapp_url || "#") + '" target="_blank">Open WhatsApp</a>' +
              '<button class="spacioarte-kommo-btn spacioarte-kommo-btn--ghost" data-action="copy-link" data-link="' + safeText(state.shareResult.share_url || "") + '">Copy link</button>' +
            '</div>'
          )
        : "";

      return (
        '<div class="spacioarte-kommo-shell">' +
          '<div class="spacioarte-kommo-section">' +
            '<div class="spacioarte-kommo-header">' +
              '<div>' +
                '<div class="spacioarte-kommo-eyebrow">SpacioArte ERP</div>' +
                '<h3 class="spacioarte-kommo-title">' + safeText((state.context && state.context.title) || "Kommo card") + '</h3>' +
                '<div class="spacioarte-kommo-meta">' + safeText((state.context && state.context.entityType) || "card") + " #" + safeText((state.context && state.context.entityId) || "-") + '</div>' +
              '</div>' +
              '<button class="spacioarte-kommo-btn" data-action="refresh">Refresh</button>' +
            '</div>' +
            '<div class="spacioarte-kommo-status">' +
              '<span>API</span><strong>' + safeText(settings.apiBaseUrl || "Not configured") + '</strong>' +
            '</div>' +
            (state.error ? '<div class="spacioarte-kommo-alert">' + safeText(state.error) + '</div>' : '') +
            (state.loading ? '<div class="spacioarte-kommo-loading">Loading ERP data...</div>' : '') +
            '<div class="spacioarte-kommo-actions">' +
              '<button class="spacioarte-kommo-btn" data-action="sync-card">' + (state.syncing ? "Syncing..." : "Sync current card") + '</button>' +
            '</div>' +
          '</div>' +
          contactHtml +
          oauthHtml +
          '<div class="spacioarte-kommo-card">' +
            '<div class="spacioarte-kommo-card__title">Order Lookup</div>' +
            '<div class="spacioarte-kommo-order-form">' +
              '<input class="spacioarte-kommo-input" id="spacioarte-order-input" placeholder="' + safeText(settings.defaultOrderPrefix || "OV-") + '000001" />' +
              '<button class="spacioarte-kommo-btn" data-action="lookup-order">Search</button>' +
            '</div>' +
            orderHtml +
          '</div>' +
          '<div class="spacioarte-kommo-card">' +
            '<div class="spacioarte-kommo-card__title">Invoices</div>' +
            '<div class="spacioarte-kommo-list">' + invoicesHtml + '</div>' +
          '</div>' +
          '<div class="spacioarte-kommo-card">' +
            '<div class="spacioarte-kommo-card__title">Quotes</div>' +
            '<div class="spacioarte-kommo-list">' + quotesHtml + '</div>' +
          '</div>' +
          shareHtml +
        '</div>'
      );
    }

    function renderWidget() {
      root().html(widgetBody());
    }

    function renderSettingsHelp() {
      var $modal = $(".modal." + widgetCode() + " .modal-body");
      var $block = $modal.find(".widget_settings_block");

      if (!$block.length || $block.find(".spacioarte-kommo-settings-help").length) {
        return true;
      }

      $block.prepend(
        '<div class="spacioarte-kommo-settings-help">' +
          '<p><strong>API Base URL:</strong> use the ERP base URL, for example <code>https://erp.yourdomain.com</code>.</p>' +
          '<p><strong>Integration Key:</strong> use the ERP <code>KOMMO_INTEGRATION_KEY</code>.</p>' +
          '<p><strong>Order Prefix:</strong> optional helper placeholder, e.g. <code>OV-</code>.</p>' +
        "</div>"
      );

      return true;
    }

    function bindEvents() {
      $(document)
        .off("click.spacioarteKommo")
        .on("click.spacioarteKommo", "[data-action='refresh']", function () {
          state.shareResult = null;
          initialLoad();
        })
        .on("click.spacioarteKommo", "[data-action='sync-card']", function () {
          syncCurrentCard();
        })
        .on("click.spacioarteKommo", "[data-action='lookup-order']", function () {
          var value = $("#spacioarte-order-input").val();
          if (value) {
            lookupOrder(value);
          }
        })
        .on("click.spacioarteKommo", "[data-action='share-invoice']", function () {
          shareInvoice($(this).data("id"));
        })
        .on("click.spacioarteKommo", "[data-action='copy-link']", function () {
          var link = $(this).data("link");
          if (navigator.clipboard && link) {
            navigator.clipboard.writeText(link);
          }
        });
    }

    this.callbacks = {
      render: function () {
        if (typeof APP !== "undefined" && APP.data && APP.data.current_card && APP.data.current_card.id === 0) {
          return false;
        }

        self.render_template({
          caption: {
            class_name: "spacioarte-kommo-caption",
            html: "SpacioArte ERP",
          },
          body: "",
          render:
            '<div class="spacioarte-kommo-root"></div>' +
            '<link rel="stylesheet" type="text/css" href="/widgets/' + widgetCode() + '/style.css?v=' + encodeURIComponent(self.get_version ? self.get_version() : "1") + '">'
        });

        renderWidget();

        return true;
      },

      init: function () {
        if (self.system().area === "lcard" || self.system().area === "ccard") {
          initialLoad();
        }

        return true;
      },

      bind_actions: function () {
        bindEvents();
        return true;
      },

      settings: function () {
        return renderSettingsHelp();
      },

      onSave: function () {
        return true;
      },
    };
  };
});
