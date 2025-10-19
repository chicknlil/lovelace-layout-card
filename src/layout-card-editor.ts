import { LitElement, html, CSSResultArray, css } from "lit";
import { property, state, query } from "lit/decorators.js";
import { LayoutCardConfig } from "./types";
import { loadHaForm, LAYOUT_CARD_SELECTOR_OPTIONS } from "./helpers";

const DEFAULT_LAYOUT_TYPES = ["masonry", "sidebar", "panel"];

class LayoutCardEditor extends LitElement {
  @property() _config: LayoutCardConfig;
  @property() lovelace;
  @property() hass;

  @state() _selectedTab = 0;
  @state() _selectedCard = 0;
  @state() _cardGUIMode = true;
  @state() _cardGUIModeAvailable = true;

  @query("hui-card-element-editor") _cardEditorEl?;

  _schema = (localize) => [
    {
      name: "layout_type",
      selector: {
        select: {
          options: [
            ...DEFAULT_LAYOUT_TYPES.map((type) => ({
              value: type,
              label: localize(
                `ui.panel.lovelace.editor.edit_view.types.${type}`
              ),
            })),
            ...LAYOUT_CARD_SELECTOR_OPTIONS,
          ],
        },
      },
    },
    {
      name: "layout",
      selector: { object: {} },
    },
  ];

  setConfig(config) {
    this._config = config;
  }

  firstUpdated() {
    loadHaForm();
    // Add event listener to debug all events
    this.shadowRoot?.addEventListener('*', (e) => {
      console.log('[LAYOUT-CARD DEBUG] Event:', e.type, e);
    }, true);
  }

  _handleSwitchTab(ev: CustomEvent) {
    console.log('[LAYOUT-CARD DEBUG] _handleSwitchTab called', ev);
    console.log('[LAYOUT-CARD DEBUG] Event type:', ev.type);
    console.log('[LAYOUT-CARD DEBUG] Event detail:', ev.detail);
    console.log('[LAYOUT-CARD DEBUG] Event target:', ev.target);
    console.log('[LAYOUT-CARD DEBUG] Event currentTarget:', ev.currentTarget);
    
    ev.stopPropagation();
    
    // Try multiple possible event structures
    if (ev.detail) {
      if (ev.detail.activeTab !== undefined) {
        console.log('[LAYOUT-CARD DEBUG] Using ev.detail.activeTab:', ev.detail.activeTab);
        this._selectedTab = ev.detail.activeTab;
      } else if (ev.detail.tab) {
        if (ev.detail.tab.panel !== undefined) {
          console.log('[LAYOUT-CARD DEBUG] Using ev.detail.tab.panel:', ev.detail.tab.panel);
          this._selectedTab = parseInt(ev.detail.tab.panel, 10);
        }
      } else if (ev.detail.name !== undefined) {
        console.log('[LAYOUT-CARD DEBUG] Using ev.detail.name:', ev.detail.name);
        this._selectedTab = parseInt(ev.detail.name, 10);
      } else {
        console.warn('[LAYOUT-CARD DEBUG] Unknown event structure for tab switch');
        console.log('[LAYOUT-CARD DEBUG] Full event:', JSON.stringify(ev.detail));
      }
    }
  }

  _editCard(ev) {
    console.log('[LAYOUT-CARD DEBUG] _editCard called', ev);
    console.log('[LAYOUT-CARD DEBUG] Event detail:', ev.detail);
    
    ev.stopPropagation();
    
    let tabIndex = null;
    
    // Try multiple possible event structures
    if (ev.detail) {
      if (ev.detail.activeTab !== undefined) {
        console.log('[LAYOUT-CARD DEBUG] Using ev.detail.activeTab:', ev.detail.activeTab);
        tabIndex = ev.detail.activeTab;
      } else if (ev.detail.tab) {
        if (ev.detail.tab.panel === "add-card" || ev.detail.tab.id === "add-card") {
          console.log('[LAYOUT-CARD DEBUG] Add card tab clicked');
          this._selectedCard = this._config.cards.length;
          return;
        } else if (ev.detail.tab.panel !== undefined) {
          console.log('[LAYOUT-CARD DEBUG] Using ev.detail.tab.panel:', ev.detail.tab.panel);
          tabIndex = parseInt(ev.detail.tab.panel, 10);
        }
      } else if (ev.detail.name !== undefined) {
        if (ev.detail.name === "add-card") {
          console.log('[LAYOUT-CARD DEBUG] Add card tab clicked (name)');
          this._selectedCard = this._config.cards.length;
          return;
        }
        console.log('[LAYOUT-CARD DEBUG] Using ev.detail.name:', ev.detail.name);
        tabIndex = parseInt(ev.detail.name, 10);
      }
    }
    
    if (tabIndex !== null) {
      if (tabIndex >= this._config.cards.length) {
        console.log('[LAYOUT-CARD DEBUG] Tab index >= cards length, treating as add-card');
        this._selectedCard = this._config.cards.length;
        return;
      }
      this._cardGUIMode = true;
      if (this._cardEditorEl) this._cardEditorEl.GUImode = true;
      this._cardGUIModeAvailable = true;
      this._selectedCard = tabIndex;
    } else {
      console.warn('[LAYOUT-CARD DEBUG] Could not determine tab index');
    }
  }
  
  _addCard(ev: CustomEvent) {
    ev.stopPropagation();
    const cards = [...this._config.cards];
    cards.push(ev.detail.config);
    this._config = { ...this._config, cards };
    this._selectedCard = this._config.cards.length - 1;
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config: this._config } })
    );
  }
  _updateCard(ev) {
    ev.stopPropagation();
    const cards = [...this._config.cards];
    cards[this._selectedCard] = ev.detail.config;
    this._config = { ...this._config, cards };
    this._cardGUIModeAvailable = ev.detail.guiModeAvailable;
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config: this._config } })
    );
  }
  _GUIModeChange(ev) {
    ev.stopPropagation();
    this._cardGUIMode = ev.detail.guiMode;
    this._cardGUIModeAvailable = ev.detail.guiModeAvailable;
  }
  _toggleMode(ev) {
    this._cardEditorEl.toggleMode();
  }
  _moveCard(ev) {
    const source = this._selectedCard;
    const target = source + ev.currentTarget.move;
    const cards = [...this._config.cards];
    const card = cards.splice(source, 1)[0];
    cards.splice(target, 0, card);
    this._config = { ...this._config, cards };
    this._selectedCard = target;
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config: this._config } })
    );
  }
  _deleteCard() {
    const cards = [...this._config.cards];
    cards.splice(this._selectedCard, 1);
    this._config = { ...this._config, cards };
    this._selectedCard = Math.max(0, this._selectedCard - 1);
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config: this._config } })
    );
  }

  _valueChanged(ev) {
    ev.stopPropagation();
    const config = ev.detail.value;

    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config } })
    );
  }

  _computeLabel(schema) {
    if (schema.name === "layout_type")
      return this.hass.localize("ui.panel.lovelace.editor.edit_view.type");
    if (schema.name === "layout") return "Layout options (layout-card)";
  }

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    console.log('[LAYOUT-CARD DEBUG] Rendering, selectedTab:', this._selectedTab);

    return html`
      <div class="card-config">
        <ha-tab-group 
          .activeTab=${this._selectedTab}
          @active-tab-changed=${this._handleSwitchTab}
          @tab-show=${this._handleSwitchTab}
        >
          <ha-tab-group-tab .panel=${0}>
            Layout
          </ha-tab-group-tab>
          <ha-tab-group-tab .panel=${1}>
            Cards
          </ha-tab-group-tab>
        </ha-tab-group>
        <div id="editor">
          ${[this._renderLayoutEditor, this._renderCardsEditor][
            this._selectedTab
          ].bind(this)()}
        </div>
      </div>
    `;
  }

  _renderLayoutEditor() {
    const schema = this._schema(this.hass.localize);
    const data = {
      ...this._config,
    };
    return html`
      <p>
        See
        <a
          href="https://github.com/thomasloven/lovelace-layout-card"
          target="_blank"
          rel="no referrer"
        >
          layout-card on github
        </a>
        for usage instructions.
      </p>
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${schema}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  _renderCardsEditor() {
    const selected = this._selectedCard;
    const numcards = this._config.cards.length;
    console.log('[LAYOUT-CARD DEBUG] Rendering cards editor, selected:', selected, 'numcards:', numcards);
    
    if (this._config.entities) {
      return html`
        This layout-card has the <code>entities</code> parameter set. You cannot
        manually select cards.
      `;
    }
    return html`
      <div class="cards">
        <ha-tab-group
          .activeTab=${selected >= numcards ? numcards : selected}
          @active-tab-changed=${this._editCard}
          @tab-show=${this._editCard}
        >
          ${this._config.cards.map((_card, i) => {
            return html`
              <ha-tab-group-tab .panel=${i}>
                ${i + 1}
              </ha-tab-group-tab>
            `;
          })}
          <ha-tab-group-tab .panel=${"add-card"} id="add-card">
            <ha-icon .icon=${"mdi:plus"}></ha-icon>
          </ha-tab-group-tab>
        </ha-tab-group>
        <div id="editor">
          ${selected < numcards
            ? html`
                <div class="card-options">
                  <mwc-button
                    @click=${this._toggleMode}
                    .disabled=${!this._cardGUIModeAvailable}
                    class="gui-mode-button"
                  >
                    ${this.hass.localize(
                      this._cardEditorEl || this._cardGUIMode
                        ? "ui.panel.lovelace.editor.edit_card.show_code_editor"
                        : "ui.panel.lovelace.editor.edit_card.show_visual_editor"
                    )}
                  </mwc-button>
                  <mwc-icon-button
                    .disabled=${selected === 0}
                    @click=${this._moveCard}
                    .move=${-1}
                  >
                    <ha-icon .icon=${"mdi:arrow-left"}></ha-icon>
                  </mwc-icon-button>
                  <mwc-icon-button
                    .disabled=${selected === numcards - 1}
                    @click=${this._moveCard}
                    .move=${1}
                  >
                    <ha-icon .icon=${"mdi:arrow-right"}></ha-icon>
                  </mwc-icon-button>
                  <mwc-icon-button @click=${this._deleteCard}>
                    <ha-icon .icon=${"mdi:delete"}></ha-icon>
                  </mwc-icon-button>
                </div>
                <hui-card-element-editor
                  .hass=${this.hass}
                  .value=${this._config.cards[selected]}
                  .lovelace=${this.lovelace}
                  @config-changed=${this._updateCard}
                  @GUImode-changed=${this._GUIModeChange}
                ></hui-card-element-editor>
              `
            : html`
                <hui-card-picker
                  .hass=${this.hass}
                  .lovelace=${this.lovelace}
                  @config-changed=${this._addCard}
                ></hui-card-picker>
              `}
        </div>
      </div>
    `;
  }

  static get styles(): CSSResultArray {
    return [
      css`
        mwc-tab-bar {
          border-bottom: 1px solid var(--divider-color);
        }

        .layout,
        .cards #editor {
          margin-top: 8px;
          border: 1px solid var(--divider-color);
          padding: 12px;
        }

        #add-card {
          max-width: 32px;
          padding: 0;
        }
        ha-tab-group {
          margin-top: -16px;
          margin-bottom: 16px;
        }
        ha-tab-group-tab {
          flex: 1;
        }
        ha-tab-group-tab::part(base) {
          width: 100%;
          justify-content: center;
        }

        .cards .card-options {
          display: flex;
          justify-content: flex-end;
          width: 100%;
        }
        #editor {
          border: 1px solid var(--divider-color);
          padding: 12px;
        }
        .gui-mode-button {
          margin-right: auto;
        }

        a {
          color: var(--primary-color);
        }
      `,
    ];
  }
}

customElements.define("layout-card-editor", LayoutCardEditor);
