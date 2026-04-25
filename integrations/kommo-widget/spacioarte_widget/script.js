define(["jquery"], function ($) {
  "use strict";

  return function () {
    var self = this;
    var state = {
      context: null,
      kommoSnapshot: null,
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
      return (self.get_settings && self.get_settings().widget_code) || "spacioarte_widget";
    }

    function widgetSettingsMeta() {
      return self.get_settings ? self.get_settings() : {};
    }

    function ensureStylesLoaded() {
      var settings = widgetSettingsMeta();
      var version = settings.version || "1";
      var basePath = settings.path || ("/widgets/" + widgetCode() + "/");

      if (basePath.slice(-1) !== "/") {
        basePath += "/";
      }

      var href = basePath + "style.css?v=" + encodeURIComponent(version);

      if ($('link[href="' + href + '"]').length < 1) {
        $("head").append('<link href="' + href + '" type="text/css" rel="stylesheet">');
      }
    }

    function root() {
      return $(".spacioarte-kommo-root");
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

    function erpUrl(path) {
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
        return "Sin fecha";
      }

      try {
        return new Date(value).toLocaleDateString();
      } catch (e) {
        return value;
      }
    }

    function truncate(value, max) {
      var text = String(value || "");

      if (text.length <= max) {
        return text;
      }

      return text.slice(0, max - 1) + "...";
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

      return attrs.name || attrs.title || attrs.company_name || "Registro de Kommo";
    }

    function cardPrice() {
      var attrs = currentCardModelAttributes();
      return parseFloat(attrs.price || 0);
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

    function normalizeSnapshotCandidate(snapshot) {
      snapshot = snapshot || {};

      return normalizeContactCandidate({
        id: snapshot.id || snapshot.entity_id || null,
        name: snapshot.name || "",
        phones: snapshot.phone ? [snapshot.phone] : [],
        emails: snapshot.email ? [snapshot.email] : [],
      });
    }

    function cleanValue(value) {
      return String(value || "").replace(/\s+/g, " ").trim();
    }

    function uniqueValues(values) {
      var seen = {};
      var result = [];

      $.each(values || [], function (_, value) {
        var normalized = cleanValue(value);

        if (!normalized || seen[normalized]) {
          return;
        }

        seen[normalized] = true;
        result.push(normalized);
      });

      return result;
    }

    function extractFieldValuesFromCustomFields(fieldNeedles) {
      var attrs = currentCardModelAttributes();
      var customFields = attrs.custom_fields_values || [];
      var values = [];

      $.each(customFields, function (_, field) {
        var code = String(field.field_code || "").toLowerCase();
        var name = String(field.field_name || "").toLowerCase();
        var matches = false;

        $.each(fieldNeedles, function (_, needle) {
          needle = String(needle).toLowerCase();

          if (code === needle || name.indexOf(needle) !== -1) {
            matches = true;
            return false;
          }
        });

        if (!matches) {
          return;
        }

        $.each(field.values || [], function (_, item) {
          if ($.isPlainObject(item) && item.value) {
            values.push(item.value);
          } else if (item) {
            values.push(item);
          }
        });
      });

      return uniqueValues(values);
    }

    function extractVisibleContactInputs(selectors) {
      var values = [];

      $.each(selectors, function (_, selector) {
        $(selector).each(function () {
          var raw = "";

          if (this.tagName && this.tagName.toLowerCase() === "input") {
            raw = $(this).val();
          } else {
            raw = $(this).text();
          }

          raw = cleanValue(raw);

          if (raw) {
            values.push(raw);
          }
        });
      });

      return uniqueValues(values);
    }

    function contactCardCandidateFromDom() {
      var attrs = currentCardModelAttributes();
      var phoneValues = extractVisibleContactInputs([
        ".card-cf-table-main-entity .phone_wrapper input[type=text]:visible",
        ".card-cf-table-main-entity input[name*='PHONE']:visible",
        ".card-cf-table-main-entity .multifield__value input:visible"
      ]).concat(extractFieldValuesFromCustomFields(["phone", "telefono", "teléfono"]));

      var emailValues = extractVisibleContactInputs([
        ".card-cf-table-main-entity .email_wrapper input[type=text]:visible",
        ".card-cf-table-main-entity input[name*='EMAIL']:visible"
      ]).concat(extractFieldValuesFromCustomFields(["email", "correo"]));

      phoneValues = uniqueValues(phoneValues);
      emailValues = uniqueValues(emailValues);

      return normalizeContactCandidate({
        id: currentCard() ? currentCard().id : null,
        name: attrs.name || cardTitle(),
        phones: phoneValues,
        emails: emailValues,
      });
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

    function fetchKommoSnapshot() {
      if (!state.context || !state.context.entityId) {
        return $.Deferred().resolve(null).promise();
      }

      return request(
        "GET",
        "/api/integrations/kommo/entities/" + encodeURIComponent(state.context.entityType) + "/" + encodeURIComponent(state.context.entityId) + "/snapshot",
        { subdomain: currentAccountSubdomain() || undefined }
      );
    }

    function resolveCardContacts() {
      if (typeof self.get_current_card_contacts_data === "function") {
        return self.get_current_card_contacts_data()
          .then(function (contacts) {
            var normalized = $.map(contacts || [], normalizeContactCandidate);

            if (currentEntityType() === "contacts") {
              normalized.unshift(contactCardCandidateFromDom());
            }

            if (state.kommoSnapshot) {
              if (state.kommoSnapshot.entity_type === "contacts") {
                normalized.unshift(normalizeSnapshotCandidate(state.kommoSnapshot));
              }

              if (state.kommoSnapshot.entity_type === "leads" && $.isArray(state.kommoSnapshot.contacts)) {
                normalized = $.map(state.kommoSnapshot.contacts, normalizeSnapshotCandidate).concat(normalized);
              }
            }

            return normalized;
          })
          .catch(function () {
            return fallbackCardContacts();
          });
      }

      return $.Deferred().resolve(fallbackCardContacts()).promise();
    }

    function fallbackCardContacts() {
      var attrs = currentCardModelAttributes();

      if (currentEntityType() === "contacts") {
        return [contactCardCandidateFromDom()];
      }

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
        return $.Deferred().resolve({ data: [] }).promise();
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
      var snapshot = state.kommoSnapshot || {};
      var entityType = state.context ? state.context.entityType : currentEntityType();

      if (entityType === "leads") {
        if (snapshot.primary_contact) {
          primary = normalizeSnapshotCandidate(snapshot.primary_contact);
        }

        return {
          path: "/api/integrations/kommo/leads/sync",
          payload: {
            kommo_lead_id: String(state.context.entityId),
            kommo_contact_id: primary.id ? String(primary.id) : null,
            title: snapshot.name || attrs.name || cardTitle(),
            company_name: primary.name || snapshot.name || attrs.name || null,
            contact_name: primary.name || snapshot.name || attrs.name || null,
            email: primary.email || "",
            phone: primary.phone || "",
            expected_value: snapshot.price || attrs.price || 0,
            notes: "Sincronizado desde el widget privado de Kommo.",
          },
        };
      }

      if (snapshot.entity_type === "contacts") {
        primary = normalizeSnapshotCandidate(snapshot);
      }

      return {
        path: "/api/integrations/kommo/contacts/sync",
        payload: {
          kommo_contact_id: String(state.context.entityId),
          name: primary.name || snapshot.name || attrs.name || cardTitle(),
          company_name: primary.name || snapshot.name || attrs.name || cardTitle(),
          contact_name: primary.name || snapshot.name || attrs.name || cardTitle(),
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
          setError(extractXhrError(xhr, "No se pudo sincronizar la tarjeta actual."));
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
          setError(extractXhrError(xhr, "No se encontro esa orden en el ERP."));
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
          setError(extractXhrError(xhr, "No se pudo generar el enlace de WhatsApp."));
        });
    }

    function extractXhrError(xhr, fallback) {
      if (xhr && xhr.responseJSON) {
        return xhr.responseJSON.message || fallback;
      }

      return fallback;
    }

    function fetchOAuthStatus() {
      var subdomain = currentAccountSubdomain();

      return request("GET", "/api/integrations/kommo/oauth/status", {
        subdomain: subdomain || undefined,
      });
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

      $.when(fetchOAuthStatus(), fetchKommoSnapshot())
        .then(function (oauthResponse, snapshotResponse) {
          var snapshotPayload = snapshotResponse;

          if ($.isArray(oauthResponse) && oauthResponse.length) {
            state.oauthStatus = oauthResponse[0];
          } else if ($.isPlainObject(oauthResponse)) {
            state.oauthStatus = oauthResponse;
          }

          if ($.isArray(snapshotResponse) && snapshotResponse.length) {
            snapshotPayload = snapshotResponse[0];
          }

          state.kommoSnapshot = snapshotPayload && snapshotPayload.data ? snapshotPayload.data : null;

          return resolveCardContacts();
        })
        .then(function (contactsResponse) {
          var contacts = contactsResponse;

          if ($.isArray(contactsResponse) && contactsResponse.length && $.isArray(contactsResponse[0])) {
            contacts = contactsResponse[0];
          }

          state.context.contacts = contacts || [];
          return autoMatchContact();
        })
        .fail(function () {
          setError("No se pudo inicializar el widget con los datos del ERP.");
        })
        .always(function () {
          setLoading(false);
        });
    }

    function openExternal(url) {
      if (!url) {
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    }

    function copyToClipboard(text) {
      if (!text) {
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      }
    }

    function openErpSection(section) {
      var routes = {
        contactos: "/contactos",
        cotizaciones: "/ventas/cotizaciones",
        cotizacionNueva: "/ventas/cotizaciones/crear",
        ordenes: "/ventas/ordenes",
        ordenNueva: "/ventas/ordenes/crear",
        facturas: "/ventas/facturas",
      };

      openExternal(erpUrl(routes[section] || "/"));
    }

    function contactStatusLabel() {
      if (!state.matchedContact) {
        return "Sin vincular";
      }

      if (state.matchedContact.saldo_pendiente_facturas > 0) {
        return "Cliente con saldo";
      }

      return "Cliente ERP vinculado";
    }

    function candidateSummary() {
      var contacts = (state.context && state.context.contacts) || [];
      var primary = contacts[0] || {};
      var parts = [];

      if (primary.name) {
        parts.push(primary.name);
      }
      if (primary.phone) {
        parts.push(primary.phone);
      }
      if (primary.email) {
        parts.push(primary.email);
      }

      return parts.join(" - ") || "No hay contacto vinculado en esta tarjeta de Kommo.";
    }

    function totalPendingBalance() {
      var total = 0;

      $.each(state.invoices || [], function (_, invoice) {
        total += parseFloat(invoice.saldo_pendiente || 0);
      });

      return total;
    }

    function latestDeliveryDate() {
      if (!state.order || !state.order.fecha_entrega) {
        return "Sin consulta";
      }

      return shortDate(state.order.fecha_entrega);
    }

    function heroClass() {
      if (state.error) {
        return "spacioarte-kommo-hero spacioarte-kommo-hero--danger";
      }

      if (state.matchedContact) {
        return "spacioarte-kommo-hero spacioarte-kommo-hero--ready";
      }

      return "spacioarte-kommo-hero";
    }

    function actionTile(label, subtitle, action, modifier) {
      return (
        '<button class="spacioarte-kommo-tile' + (modifier ? " " + modifier : "") + '" data-action="' + safeText(action) + '">' +
          '<span class="spacioarte-kommo-tile__label">' + safeText(label) + "</span>" +
          (subtitle ? '<span class="spacioarte-kommo-tile__meta">' + safeText(subtitle) + "</span>" : "") +
        "</button>"
      );
    }

    function linkTile(label, subtitle, href, modifier) {
      return (
        '<button class="spacioarte-kommo-tile' + (modifier ? " " + modifier : "") + '" data-action="open-link" data-link="' + safeText(href) + '">' +
          '<span class="spacioarte-kommo-tile__label">' + safeText(label) + "</span>" +
          (subtitle ? '<span class="spacioarte-kommo-tile__meta">' + safeText(subtitle) + "</span>" : "") +
        "</button>"
      );
    }

    function metricCard(label, value, tone) {
      return (
        '<div class="spacioarte-kommo-metric' + (tone ? " " + tone : "") + '">' +
          '<div class="spacioarte-kommo-metric__label">' + safeText(label) + "</div>" +
          '<div class="spacioarte-kommo-metric__value">' + safeText(value) + "</div>" +
        "</div>"
      );
    }

    function renderDocumentList(items, type) {
      if (!items.length) {
        return '<div class="spacioarte-kommo-empty">Todavia no hay ' + safeText(type === "invoice" ? "facturas" : "cotizaciones") + " para este cliente.</div>";
      }

      return $.map(items.slice(0, 4), function (item) {
        var title = type === "invoice" ? item.numero_factura : item.numero_cotizacion;
        var status = item.estado || "Sin estado";
        var href = type === "invoice"
          ? erpUrl("/ventas/facturas/" + item.id)
          : erpUrl("/ventas/cotizaciones/" + item.id + "/editar");
        var actionHtml = type === "invoice"
          ? (
              '<div class="spacioarte-kommo-list-item__actions">' +
                '<button class="spacioarte-kommo-chip-btn" data-action="share-invoice" data-id="' + safeText(item.id) + '">WhatsApp</button>' +
                '<button class="spacioarte-kommo-chip-btn spacioarte-kommo-chip-btn--light" data-action="open-link" data-link="' + safeText(href) + '">Abrir</button>' +
              "</div>"
            )
          : (
              '<div class="spacioarte-kommo-list-item__actions">' +
                '<button class="spacioarte-kommo-chip-btn spacioarte-kommo-chip-btn--light" data-action="open-link" data-link="' + safeText(href) + '">Abrir</button>' +
              "</div>"
            );

        return (
          '<div class="spacioarte-kommo-list-item">' +
            '<div class="spacioarte-kommo-list-item__body">' +
              '<div class="spacioarte-kommo-list-item__title">' + safeText(title || "Documento") + "</div>" +
              '<div class="spacioarte-kommo-list-item__meta">' + safeText(status) + " - " + safeText(shortDate(item.fecha_emision)) + "</div>" +
            "</div>" +
            '<div class="spacioarte-kommo-list-item__side">' +
              '<div class="spacioarte-kommo-list-item__amount">' + money(item.total || 0) + "</div>" +
              actionHtml +
            "</div>" +
          "</div>"
        );
      }).join("");
    }

    function renderMatchedContactCard() {
      if (!state.matchedContact) {
        return (
          '<div class="spacioarte-kommo-card spacioarte-kommo-card--muted">' +
            '<div class="spacioarte-kommo-card__title">Cliente ERP</div>' +
            '<div class="spacioarte-kommo-empty">Este lead aun no coincide con un cliente del ERP. Usa "Sincronizar cliente" y vuelve a cargar.</div>' +
            '<div class="spacioarte-kommo-hint-list">' +
              '<div class="spacioarte-kommo-hint">Lead: ' + safeText(truncate(candidateSummary(), 54)) + "</div>" +
              '<div class="spacioarte-kommo-hint">Match ideal: telefono, email o nombre iguales al ERP.</div>' +
            "</div>" +
          "</div>"
        );
      }

      return (
        '<div class="spacioarte-kommo-card">' +
          '<div class="spacioarte-kommo-card__title">Cliente ERP</div>' +
          '<div class="spacioarte-kommo-contact-head">' +
            '<div>' +
              '<div class="spacioarte-kommo-contact-name">' + safeText(state.matchedContact.razon_social) + "</div>" +
              '<div class="spacioarte-kommo-contact-meta">' + safeText(state.matchedContact.identificacion || "Sin identificacion") + "</div>" +
            "</div>" +
            '<div class="spacioarte-kommo-pill spacioarte-kommo-pill--ok">Vinculado</div>' +
          "</div>" +
          '<div class="spacioarte-kommo-info-grid">' +
            '<div class="spacioarte-kommo-info-block"><span>Telefono</span><strong>' + safeText(state.matchedContact.telefono || "Sin telefono") + "</strong></div>" +
            '<div class="spacioarte-kommo-info-block"><span>Email</span><strong>' + safeText(state.matchedContact.email || "Sin email") + "</strong></div>" +
            '<div class="spacioarte-kommo-info-block"><span>Condicion</span><strong>' + safeText(state.matchedContact.payment_term || "Sin condicion") + "</strong></div>" +
            '<div class="spacioarte-kommo-info-block"><span>Saldo pendiente</span><strong>' + money(state.matchedContact.saldo_pendiente_facturas || 0) + "</strong></div>" +
          "</div>" +
        "</div>"
      );
    }

    function renderOrderSection() {
      var orderHtml = state.order
        ? (
            '<div class="spacioarte-kommo-order-card">' +
              '<div class="spacioarte-kommo-order-card__header">' +
                '<div>' +
                  '<div class="spacioarte-kommo-order-card__title">' + safeText(state.order.numero_orden) + "</div>" +
                  '<div class="spacioarte-kommo-order-card__meta">' + safeText(state.order.estado || "Sin estado") + "</div>" +
                "</div>" +
                '<button class="spacioarte-kommo-chip-btn spacioarte-kommo-chip-btn--light" data-action="open-link" data-link="' + safeText(erpUrl("/ventas/ordenes/" + state.order.id)) + '">Abrir orden</button>' +
              "</div>" +
              '<div class="spacioarte-kommo-info-grid">' +
                '<div class="spacioarte-kommo-info-block"><span>Diseno</span><strong>' + safeText(state.order.estado_diseno || "Sin dato") + "</strong></div>" +
                '<div class="spacioarte-kommo-info-block"><span>Entrega</span><strong>' + safeText(shortDate(state.order.fecha_entrega)) + "</strong></div>" +
                '<div class="spacioarte-kommo-info-block"><span>Total</span><strong>' + money(state.order.total || 0) + "</strong></div>" +
                '<div class="spacioarte-kommo-info-block"><span>Pendiente</span><strong>' + money(state.order.saldo_pendiente || 0) + "</strong></div>" +
              "</div>" +
              (state.order.tracking_url
                ? '<button class="spacioarte-kommo-wide-btn" data-action="open-link" data-link="' + safeText(state.order.tracking_url) + '">Abrir tracking del cliente</button>'
                : "") +
            "</div>"
          )
        : '<div class="spacioarte-kommo-empty">Busca una orden para ver entrega, saldo y tracking del cliente.</div>';

      return (
        '<div class="spacioarte-kommo-card">' +
          '<div class="spacioarte-kommo-card__title">Consulta de orden</div>' +
          '<div class="spacioarte-kommo-order-form">' +
            '<input class="spacioarte-kommo-input" id="spacioarte-order-input" placeholder="' + safeText(getWidgetSettings().defaultOrderPrefix || "OV-") + '000001" />' +
            '<button class="spacioarte-kommo-btn" data-action="lookup-order">Buscar</button>' +
          "</div>" +
          orderHtml +
        "</div>"
      );
    }

    function renderWidget() {
      var settings = getWidgetSettings();
      var entityType = (state.context && state.context.entityType) || "lead";
      var entityLabel = entityType === "leads" ? "Lead" : "Contacto";
      var canOpenContactArea = !!settings.apiBaseUrl;
      var quickActions = [
        actionTile(state.matchedContact ? "Actualizar cliente" : "Sincronizar cliente", state.matchedContact ? "Refrescar ERP" : "Crear o vincular", "sync-card", "spacioarte-kommo-tile--primary"),
        linkTile("Clientes ERP", "Directorio", canOpenContactArea ? erpUrl("/contactos") : "#", "spacioarte-kommo-tile--neutral"),
        linkTile("Nueva cotizacion", "Crear propuesta", canOpenContactArea ? erpUrl("/ventas/cotizaciones/crear") : "#", ""),
        linkTile("Nueva orden", "Pasar a produccion", canOpenContactArea ? erpUrl("/ventas/ordenes/crear") : "#", ""),
        linkTile("Facturas", "Modulo ERP", canOpenContactArea ? erpUrl("/ventas/facturas") : "#", ""),
        linkTile("Cotizaciones", "Modulo ERP", canOpenContactArea ? erpUrl("/ventas/cotizaciones") : "#", "")
      ].join("");

      var headerHtml = (
        '<div class="' + heroClass() + '">' +
          '<div class="spacioarte-kommo-hero__top">' +
            '<div>' +
              '<div class="spacioarte-kommo-eyebrow">SpacioArte x Kommo</div>' +
              '<h3 class="spacioarte-kommo-title">' + safeText((state.context && state.context.title) || "Registro de Kommo") + "</h3>" +
              '<div class="spacioarte-kommo-meta">' + safeText(entityLabel) + " #" + safeText((state.context && state.context.entityId) || "-") + "</div>" +
            "</div>" +
            '<button class="spacioarte-kommo-btn spacioarte-kommo-btn--soft" data-action="refresh">Actualizar</button>' +
          "</div>" +
          '<div class="spacioarte-kommo-pill-row">' +
            '<div class="spacioarte-kommo-pill">' + safeText(contactStatusLabel()) + "</div>" +
            '<div class="spacioarte-kommo-pill">' + safeText(state.oauthStatus && state.oauthStatus.connected ? "OAuth conectado" : "OAuth pendiente") + "</div>" +
            '<div class="spacioarte-kommo-pill">' + safeText(truncate(candidateSummary(), 42)) + "</div>" +
          "</div>" +
          (state.error ? '<div class="spacioarte-kommo-alert">' + safeText(state.error) + "</div>" : "") +
          (state.loading ? '<div class="spacioarte-kommo-loading">Cargando datos del ERP...</div>' : "") +
        "</div>"
      );

      var metricsHtml = (
        '<div class="spacioarte-kommo-metrics">' +
          metricCard("Facturas", String(state.invoices.length), "spacioarte-kommo-metric--blue") +
          metricCard("Cotizaciones", String(state.quotes.length), "spacioarte-kommo-metric--amber") +
          metricCard("Saldo", money(totalPendingBalance()), "spacioarte-kommo-metric--dark") +
          metricCard("Entrega", latestDeliveryDate(), "spacioarte-kommo-metric--light") +
        "</div>"
      );

      var oauthCard = state.oauthStatus
        ? (
            '<div class="spacioarte-kommo-card">' +
              '<div class="spacioarte-kommo-card__title">Estado de integracion</div>' +
              '<div class="spacioarte-kommo-info-grid">' +
                '<div class="spacioarte-kommo-info-block"><span>Subdominio</span><strong>' + safeText(state.oauthStatus.subdomain || currentAccountSubdomain() || "N/A") + "</strong></div>" +
                '<div class="spacioarte-kommo-info-block"><span>OAuth</span><strong>' + safeText(state.oauthStatus.connected ? "Conectado" : "No conectado") + "</strong></div>" +
                '<div class="spacioarte-kommo-info-block"><span>ERP</span><strong>' + safeText(settings.apiBaseUrl || "Sin URL") + "</strong></div>" +
                '<div class="spacioarte-kommo-info-block"><span>Autorizado</span><strong>' + safeText(state.oauthStatus.installation && state.oauthStatus.installation.last_authorized_at ? shortDate(state.oauthStatus.installation.last_authorized_at) : "Pendiente") + "</strong></div>" +
              "</div>" +
              (!state.oauthStatus.connected && state.oauthStatus.authorization_url
                ? '<button class="spacioarte-kommo-wide-btn" data-action="open-link" data-link="' + safeText(state.oauthStatus.authorization_url) + '">Conectar cuenta de Kommo</button>'
                : "") +
            "</div>"
          )
        : "";

      var shareHtml = state.shareResult
        ? (
            '<div class="spacioarte-kommo-share">' +
              '<div class="spacioarte-kommo-card__title">Factura lista para compartir</div>' +
              '<div class="spacioarte-kommo-share__actions">' +
                '<button class="spacioarte-kommo-btn" data-action="open-link" data-link="' + safeText(state.shareResult.whatsapp_url || "#") + '">Abrir WhatsApp</button>' +
                '<button class="spacioarte-kommo-btn spacioarte-kommo-btn--soft" data-action="copy-link" data-link="' + safeText(state.shareResult.share_url || "") + '">Copiar enlace</button>' +
              "</div>" +
            "</div>"
          )
        : "";

      root().html(
        '<div class="spacioarte-kommo-shell">' +
          headerHtml +
          metricsHtml +
          '<div class="spacioarte-kommo-grid-2">' +
            '<div class="spacioarte-kommo-card">' +
              '<div class="spacioarte-kommo-card__title">Acciones rapidas</div>' +
              '<div class="spacioarte-kommo-tile-grid">' + quickActions + "</div>" +
            "</div>" +
            renderMatchedContactCard() +
          "</div>" +
          oauthCard +
          renderOrderSection() +
          '<div class="spacioarte-kommo-grid-2">' +
            '<div class="spacioarte-kommo-card">' +
              '<div class="spacioarte-kommo-card__title">Facturas del cliente</div>' +
              '<div class="spacioarte-kommo-list">' + renderDocumentList(state.invoices, "invoice") + "</div>" +
            "</div>" +
            '<div class="spacioarte-kommo-card">' +
              '<div class="spacioarte-kommo-card__title">Cotizaciones del cliente</div>' +
              '<div class="spacioarte-kommo-list">' + renderDocumentList(state.quotes, "quote") + "</div>" +
            "</div>" +
          "</div>" +
          shareHtml +
        "</div>"
      );
    }

    function renderSettingsHelp() {
      var $modal = $(".modal." + widgetCode() + " .modal-body");
      var $block = $modal.find(".widget_settings_block");

      if (!$block.length || $block.find(".spacioarte-kommo-settings-help").length) {
        return true;
      }

      $block.prepend(
        '<div class="spacioarte-kommo-settings-help">' +
          '<p><strong>URL base del ERP:</strong> usa la URL publica del ERP, por ejemplo <code>https://app.spacioarte.com</code>.</p>' +
          '<p><strong>Llave de integracion:</strong> usa el valor de <code>KOMMO_INTEGRATION_KEY</code> del ERP.</p>' +
          '<p><strong>Prefijo por defecto:</strong> ayuda al usuario a buscar ordenes, por ejemplo <code>OV-</code>.</p>' +
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
          copyToClipboard($(this).data("link"));
        })
        .on("click.spacioarteKommo", "[data-action='open-link']", function () {
          openExternal($(this).data("link"));
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
          render: '<div class="spacioarte-kommo-root"></div>'
        });

        renderWidget();

        return true;
      },

      init: function () {
        ensureStylesLoaded();

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
