'use client';

import Script from 'next/script';

export default function Home() {
  return (
    <>
      <div className="app-shell">
        <header className="topbar">
          <a className="brand" href="#home">
            <span className="brand-mark">S</span>
            <span>
              <strong>SUCATAO</strong>
              <em>// ARC COMPANION</em>
            </span>
          </a>
          <nav className="main-nav" aria-label="Navegacao principal">
            <a href="#home" data-route="home">Home</a>
            <a href="#items">Itens</a>
            <a href="#trades">Trades</a>
            <a href="#arcs">ARCs</a>
            <a href="#crafting">Crafting</a>
            <a href="#recycling">Reciclagem</a>
            <a href="#maps">Mapas</a>
            <a href="#profile">Perfil</a>
            <a id="adminNavLink" href="#admin" hidden>Admin</a>
          </nav>
          <div className="auth-shell" aria-label="Sessao do usuario">
            <div className="auth-badge">
              <span id="authStatusLabel">Offline</span>
              <strong id="authUserLabel">Visitante</strong>
            </div>
            <button id="authActionButton" type="button">Entrar</button>
            <button id="logoutButton" type="button" hidden>Sair</button>
          </div>
        </header>

        <section className="signal-bar" aria-label="Status do sistema">
          <strong>Sistema online</strong>
          <span>Dados comunitarios carregados localmente</span>
          <button type="button" id="resetButton">Resetar filtros</button>
        </section>

        <main className="content">
          {/* HOME */}
          <section id="page-home" className="page active-page" data-page="home">
            <section className="hero-panel">
              <div>
                <p className="eyebrow">
                  <span className="live-dot"></span>
                  Field intel database
                  <span>Trade values</span>
                </p>
                <h1>Banco de Itens ARC Raiders</h1>
                <p className="hero-copy">
                  Precos, raridades, crafting e reciclagem em um painel brasileiro para consulta rapida.
                </p>
                <div className="home-actions">
                  <a href="#items">Abrir catalogo</a>
                  <a href="#arcs">Ver ARCs</a>
                </div>
              </div>
              <div className="radar" aria-hidden="true">
                <span></span>
                <i></i>
              </div>
            </section>

            <section className="stats-grid" aria-label="Resumo">
              <article>
                <span>Itens</span>
                <strong id="statItems">0</strong>
              </article>
              <article>
                <span>ARCs</span>
                <strong id="statBots">0</strong>
              </article>
              <article>
                <span>Mapas</span>
                <strong id="statMaps">0</strong>
              </article>
              <article>
                <span>Trades</span>
                <strong id="statTrades">0</strong>
              </article>
            </section>

            <section className="home-grid">
              <a href="#items">
                <strong>Itens catalogados</strong>
                <span>Busca, filtros, valores e detalhe por item.</span>
              </a>
              <a href="#trades">
                <strong>Marketplace</strong>
                <span>Ofertas, custo, trader e leitura rapida de troca.</span>
              </a>
              <a href="#arcs">
                <strong>ARC intel</strong>
                <span>Ameacas, fraquezas, XP e drops clicaveis.</span>
              </a>
              <a href="#maps">
                <strong>Mapas</strong>
                <span>Base para rotas e marcadores no app final.</span>
              </a>
            </section>

            <section className="dashboard-grid" aria-label="Painel principal">
              <section className="dashboard-band">
                <div className="dashboard-panel">
                  <div className="dashboard-head">
                    <div>
                      <p>Loop diario</p>
                      <h2>Tarefas e recompensas</h2>
                    </div>
                    <span id="dailyResetLabel">Reset em 24h</span>
                  </div>
                  <div className="reward-strip">
                    <article><span>Concluidas</span><strong id="dailyDoneCount">0/0</strong></article>
                    <article><span>Pontos</span><strong id="rewardPointCount">0</strong></article>
                    <article><span>Bonus ativo</span><strong id="rewardBonusLabel">N/D</strong></article>
                  </div>
                  <div id="dailyTaskList" className="task-list"></div>
                </div>

                <div className="dashboard-panel">
                  <div className="dashboard-head">
                    <div>
                      <p>Spotlight</p>
                      <h2>Marketplace</h2>
                    </div>
                    <a href="#trades">Abrir trades</a>
                  </div>
                  <div id="marketSpotlightGrid" className="dashboard-card-grid"></div>
                </div>
              </section>

              <section className="dashboard-band">
                <div className="dashboard-panel">
                  <div className="dashboard-head">
                    <div>
                      <p>Loot premium</p>
                      <h2>Itens em destaque</h2>
                    </div>
                    <a href="#items">Ver catalogo</a>
                  </div>
                  <div id="lootSpotlightGrid" className="dashboard-card-grid"></div>
                </div>

                <div className="dashboard-panel">
                  <div className="dashboard-head">
                    <div>
                      <p>Rota do dia</p>
                      <h2>Intel recomendada</h2>
                    </div>
                    <a href="#maps">Abrir mapas</a>
                  </div>
                  <div id="intelSpotlightGrid" className="dashboard-card-grid"></div>
                </div>
              </section>
            </section>
          </section>

          {/* ITEMS */}
          <section id="page-items" className="page" data-page="items">
            <section className="control-panel" aria-label="Busca e filtros">
              <label className="search-box">
                <span>Buscar</span>
                <input id="searchInput" type="search" autoComplete="off" placeholder="Buscar itens por nome..." />
              </label>
              <div className="filter-row">
                <details id="rarityDropdown" className="filter-dropdown">
                  <summary>
                    <span>Raridade</span>
                    <strong id="raritySummary">Todos</strong>
                  </summary>
                  <div id="rarityFilters" className="dropdown-menu"></div>
                </details>
                <details id="typeDropdown" className="filter-dropdown">
                  <summary>
                    <span>Tipo</span>
                    <strong id="typeSummary">Todos</strong>
                  </summary>
                  <div id="typeFilters" className="dropdown-menu"></div>
                </details>
                <label className="sort-box">
                  <span>Ordenar</span>
                  <select id="sortSelect">
                    <option value="value-desc">Valor maior</option>
                    <option value="value-asc">Valor menor</option>
                    <option value="value-per-kg-desc">Valor por kg</option>
                    <option value="name-asc">Nome A-Z</option>
                    <option value="type-asc">Tipo</option>
                  </select>
                </label>
                <button id="favoriteToggleButton" className="favorite-filter-toggle" type="button">So favoritos</button>
              </div>
            </section>

            <section className="database-layout">
              <section className="item-section" aria-labelledby="itemsTitle">
                <div className="section-head">
                  <div>
                    <p>Displaying <strong id="visibleCount">0</strong> of <strong id="totalCount">0</strong> items</p>
                    <h2 id="itemsTitle">Itens catalogados</h2>
                  </div>
                  <span id="activeSort">Sort: value desc</span>
                </div>
                <div id="itemGrid" className="item-grid"></div>
              </section>

              <aside className="intel-panel" aria-label="Intel lateral">
                <section>
                  <h2>ARC intel</h2>
                  <p className="panel-hint">Clique em um ARC para buscar um drop relacionado.</p>
                  <div id="botList" className="bot-list"></div>
                </section>
                <section className="source-card">
                  <h2>Fonte</h2>
                  <p>Dados importados do pacote comunitario RaidTheory/arcraiders-data Tech Test 2.</p>
                  <small>Use com atribuicao para RaidTheory/arcraiders-data e arctracker.io.</small>
                </section>
              </aside>
            </section>
          </section>

          {/* ARCS */}
          <section id="page-arcs" className="page" data-page="arcs">
            <section className="arc-section" aria-labelledby="arcsTitle">
              <div className="section-head">
                <div>
                  <p>Threat database <strong id="arcCount">0</strong> units indexed</p>
                  <h2 id="arcsTitle">ARC intel expandida</h2>
                </div>
                <span>Drops clicaveis filtram o catalogo</span>
              </div>
              <div className="arc-toolbar">
                <label className="arc-search">
                  <span>Buscar ARC</span>
                  <input id="arcSearchInput" type="search" placeholder="Nome, classe, fraqueza ou drop..." autoComplete="off" />
                </label>
                <div className="arc-toolbar-stats">
                  <article><span>Visiveis</span><strong id="arcVisibleCount">0</strong></article>
                  <article><span>Drops unicos</span><strong id="arcDropCount">0</strong></article>
                </div>
              </div>
              <div id="arcThreatFilters" className="arc-threat-filters" aria-label="Filtros de ameaca"></div>
              <div id="arcGrid" className="arc-grid"></div>
            </section>
          </section>

          {/* TRADES */}
          <section id="page-trades" className="page utility-page" data-page="trades">
            <h2>Trades</h2>
            <p>Consulte ofertas por trader, custo exigido, limite diario e item recebido usando o dataset offline.</p>
            <div className="utility-toolbar">
              <label className="utility-search">
                <span>Buscar trade</span>
                <input id="tradeSearchInput" type="search" placeholder="Trader, item recebido ou custo..." autoComplete="off" />
              </label>
            </div>
            <div className="utility-stats">
              <article><span>Ofertas</span><strong id="tradeOfferCount">0</strong></article>
              <article><span>Traders</span><strong id="tradeTraderCount">0</strong></article>
              <article><span>Visiveis</span><strong id="tradeVisibleCount">0</strong></article>
            </div>
            <div id="tradeTraderFilters" className="trade-filter-row" aria-label="Filtros de trader"></div>
            <section className="utility-panel">
              <div className="utility-panel-head">
                <strong>Ofertas Disponiveis</strong>
                <small id="tradeResultLabel">0 entradas</small>
              </div>
              <div id="tradeGrid" className="utility-card-grid"></div>
            </section>
          </section>

          {/* MAPS */}
          <section id="page-maps" className="page" data-page="maps">
            <div className="section-head">
              <div>
                <p>Map database <strong id="mapPageCount">0</strong> regions indexed</p>
                <h2>Mapas</h2>
              </div>
              <span>Preview tatico para rotas e marcadores</span>
            </div>
            <section className="map-browser" aria-label="Visualizador de mapas">
              <div id="mapPageList" className="map-selector"></div>
              <article className="map-viewer">
                <div className="map-viewer-head">
                  <div>
                    <p id="selectedMapStatus">Mapa 01</p>
                    <h3 id="selectedMapTitle">Mapa</h3>
                  </div>
                  <span id="selectedMapBadge">Pronto</span>
                </div>
                <div className="map-tools">
                  <div>
                    <span>Marcadores</span>
                    <strong id="markerCount">0 ativos</strong>
                  </div>
                  <details id="mapFilterDropdown" className="map-filter-dropdown">
                    <summary>
                      <span>Filtros do mapa</span>
                      <strong id="mapFilterSummary">Tudo visivel</strong>
                    </summary>
                    <div className="map-filter-menu">
                      <label className="map-search-box">
                        <span>Buscar intel</span>
                        <input id="mapSearchInput" type="search" placeholder="Buscar pings ou rotas..." autoComplete="off" />
                      </label>
                      <section className="map-filter-section" aria-label="Presets de mapa">
                        <h4>Presets</h4>
                        <div id="mapPresetFilters" className="map-preset-grid"></div>
                      </section>
                      <section className="map-filter-section" aria-label="Filtros de marcadores">
                        <h4>Pings</h4>
                        <div id="markerFilters" className="marker-filters"></div>
                      </section>
                      <section className="map-filter-section" aria-label="Filtros de rotas">
                        <h4>Rotas</h4>
                        <div id="routeFilters" className="marker-filters"></div>
                      </section>
                      <section className="map-filter-section">
                        <h4>Camadas</h4>
                        <div className="map-layer-grid">
                          <label><input id="showMarkersInput" type="checkbox" defaultChecked /> Mostrar pings</label>
                          <label><input id="showRoutesInput" type="checkbox" defaultChecked /> Mostrar rotas</label>
                          <label>
                            Origem
                            <select id="sourceFilterSelect">
                              <option value="all">Tudo</option>
                              <option value="custom">Criados no site</option>
                              <option value="fixed">Pacote fixo</option>
                            </select>
                          </label>
                        </div>
                      </section>
                      <div className="map-filter-actions">
                        <button id="clearMapFiltersButton" type="button">Limpar mapa</button>
                      </div>
                    </div>
                  </details>
                  <div className="map-editor-actions">
                    <button id="addMarkerButton" type="button">Adicionar ping</button>
                    <button id="addRouteButton" type="button">Adicionar rota</button>
                    <button id="finishRouteButton" type="button" hidden>Salvar rota</button>
                    <button id="cancelMarkerButton" type="button" hidden>Cancelar</button>
                    <button id="restoreMarkersButton" type="button" hidden>Restaurar ocultos</button>
                    <button id="exportMarkersButton" type="button">Exportar</button>
                    <button id="importMarkersButton" type="button">Importar</button>
                    <button id="saveMarkersButton" type="button">Salvar no pacote</button>
                  </div>
                </div>
                <div id="mapSyncStatus" className="map-sync-status">Pings locais ainda nao gravados no pacote.</div>
                <div className="map-zoom-bar">
                  <span id="mapZoomLabel">Zoom 100%</span>
                  <button id="zoomOutButton" type="button">-</button>
                  <button id="zoomResetButton" type="button">100%</button>
                  <button id="zoomInButton" type="button">+</button>
                </div>
                <div id="selectedMapMedia" className="map-viewer-media"></div>
                <div className="map-info-row">
                  <p id="selectedMapDescription" className="map-description"></p>
                  <aside id="markerDetail" className="marker-detail" aria-live="polite"></aside>
                  <section id="markerList" className="marker-list-panel" aria-label="Lista de marcadores"></section>
                </div>
              </article>
            </section>
          </section>

          {/* CRAFTING */}
          <section id="page-crafting" className="page utility-page" data-page="crafting">
            <h2>Crafting</h2>
            <p>Materiais, itens craftaveis e ligacoes de receita inferidas a partir do dataset offline.</p>
            <div className="utility-toolbar">
              <label className="utility-search">
                <span>Buscar crafting</span>
                <input id="craftingSearchInput" type="search" placeholder="Item, material ou receita..." autoComplete="off" />
              </label>
            </div>
            <div className="utility-stats">
              <article><span>Craftaveis</span><strong id="craftingCraftableCount">0</strong></article>
              <article><span>Materiais base</span><strong id="craftingSourceCount">0</strong></article>
              <article><span>Ligacoes</span><strong id="craftingRecipeCount">0</strong></article>
            </div>
            <div className="utility-split">
              <section className="utility-panel">
                <div className="utility-panel-head">
                  <strong>Materiais e Componentes</strong>
                  <small id="craftingSourceLabel">0 entradas</small>
                </div>
                <div id="craftingSourceGrid" className="utility-card-grid"></div>
              </section>
              <section className="utility-panel">
                <div className="utility-panel-head">
                  <strong>Itens Craftaveis</strong>
                  <small id="craftingOutputLabel">0 entradas</small>
                </div>
                <div id="craftingOutputGrid" className="utility-card-grid"></div>
              </section>
            </div>
          </section>

          {/* RECYCLING */}
          <section id="page-recycling" className="page utility-page" data-page="recycling">
            <h2>Reciclagem</h2>
            <p>Itens reciclaveis, retorno descrito no dataset e pistas rapidas para farm de materiais.</p>
            <div className="utility-toolbar">
              <label className="utility-search">
                <span>Buscar reciclagem</span>
                <input id="recyclingSearchInput" type="search" placeholder="Item ou material obtido..." autoComplete="off" />
              </label>
            </div>
            <div className="utility-stats">
              <article><span>Itens</span><strong id="recyclingItemCount">0</strong></article>
              <article><span>Saida clara</span><strong id="recyclingKnownCount">0</strong></article>
              <article><span>Valor base</span><strong id="recyclingValueCount">0</strong></article>
            </div>
            <section className="utility-panel">
              <div className="utility-panel-head">
                <strong>Fontes Reciclaveis</strong>
                <small id="recyclingResultLabel">0 entradas</small>
              </div>
              <div id="recyclingGrid" className="utility-card-grid"></div>
            </section>
          </section>

          {/* PROFILE */}
          <section id="page-profile" className="page utility-page" data-page="profile">
            <h2>Perfil</h2>
            <p>Conta local do pacote offline com saldo, pontos, progresso diario e leitura rapida do usuario.</p>
            <section className="profile-layout">
              <section className="profile-panel profile-identity">
                <div className="utility-panel-head">
                  <strong>Identidade</strong>
                  <small id="profileStatusLabel">Visitante</small>
                </div>
                <div className="profile-hero">
                  <div className="profile-avatar" id="profileAvatar">S</div>
                  <div>
                    <h3 id="profileName">Visitante</h3>
                    <p id="profileEmail">Entre para salvar progresso por usuario no navegador.</p>
                  </div>
                </div>
                <div className="profile-action-row">
                  <button id="profileLoginButton" type="button">Entrar / criar conta</button>
                  <button id="profileLogoutButton" type="button" hidden>Sair da conta</button>
                </div>
              </section>

              <section className="profile-panel">
                <div className="utility-panel-head">
                  <strong>Carteira</strong>
                  <small>Valores atuais</small>
                </div>
                <div className="wallet-overview">
                  <article>
                    <span>Carteira real</span>
                    <strong id="profileCashBalance">0</strong>
                    <p>Saldo reaproveitado para compra direta de itens no marketplace.</p>
                  </article>
                  <article>
                    <span>Pontos do site</span>
                    <strong id="profilePointBalance">0</strong>
                    <p>Inclui pontos base da conta e bonus das tarefas diarias concluidas.</p>
                  </article>
                  <article>
                    <span>Resgates possiveis</span>
                    <strong id="profileRedeemableCount">0</strong>
                    <p>Quantidade estimada de itens que o jogador ja pode trocar usando os valores atuais.</p>
                  </article>
                </div>
              </section>

              <section className="profile-panel">
                <div className="utility-panel-head">
                  <strong>Progresso diario</strong>
                  <small id="profileDailyResetLabel">Reset diario</small>
                </div>
                <div className="reward-strip">
                  <article><span>Concluidas</span><strong id="profileDailyDoneCount">0/0</strong></article>
                  <article><span>Pontos do dia</span><strong id="profileDailyPointCount">0</strong></article>
                  <article><span>Bonus</span><strong id="profileDailyBonusLabel">N/D</strong></article>
                </div>
              </section>

              <section className="profile-panel">
                <div className="utility-panel-head">
                  <strong>Resumo da conta</strong>
                  <small>Leitura rapida</small>
                </div>
                <div className="profile-summary-grid">
                  <article><span>Favoritos</span><strong id="profileFavoriteCount">0</strong></article>
                  <article><span>Itens no catalogo</span><strong id="profileVisibleItemCount">0</strong></article>
                  <article><span>Trades ativos</span><strong id="profileTradeCount">0</strong></article>
                  <article><span>Mapas prontos</span><strong id="profileReadyMapCount">0</strong></article>
                </div>
              </section>

              <section className="profile-panel">
                <div className="utility-panel-head">
                  <strong>Beneficios e drops</strong>
                  <small id="profileCouponStatus">Cupons e loot boxes do pacote offline.</small>
                </div>
                <div className="profile-coupon-row">
                  <input id="profileCouponInput" type="text" maxLength={24} placeholder="Aplicar cupom local" />
                  <button id="profileCouponButton" type="button">Aplicar</button>
                </div>
                <div id="profileCouponList" className="profile-history-list"></div>
                <div id="profileLootboxList" className="profile-history-list"></div>
              </section>

              <section className="profile-panel">
                <div className="utility-panel-head">
                  <strong>Historico</strong>
                  <small id="profileHistoryCount">0 eventos</small>
                </div>
                <div id="profileHistoryList" className="profile-history-list"></div>
              </section>

              <section className="profile-panel">
                <div className="utility-panel-head">
                  <strong>Pedidos e entregas</strong>
                  <small id="profileOrderCount">0 pedidos</small>
                </div>
                <div className="reward-strip profile-order-strip">
                  <article><span>Pendentes</span><strong id="profilePendingOrderCount">0</strong></article>
                  <article><span>Processando</span><strong id="profileProcessingOrderCount">0</strong></article>
                  <article><span>Entregues</span><strong id="profileDeliveredOrderCount">0</strong></article>
                </div>
                <div id="profileOrderList" className="profile-history-list"></div>
              </section>

              <section className="profile-panel">
                <div className="utility-panel-head">
                  <strong>Suporte</strong>
                  <small id="profileTicketCount">0 tickets</small>
                </div>
                <div className="reward-strip profile-order-strip">
                  <article><span>Abertos</span><strong id="profileOpenTicketCount">0</strong></article>
                  <article><span>Em analise</span><strong id="profileReviewTicketCount">0</strong></article>
                  <article><span>Resolvidos</span><strong id="profileResolvedTicketCount">0</strong></article>
                </div>
                <form id="profileSupportForm" className="profile-support-form">
                  <div className="profile-support-grid">
                    <label>
                      <span>Assunto</span>
                      <input id="profileSupportSubject" type="text" maxLength={60} placeholder="Ex.: Compra nao caiu" />
                    </label>
                    <label>
                      <span>Prioridade</span>
                      <select id="profileSupportPriority">
                        <option value="baixa">Baixa</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                      </select>
                    </label>
                    <label className="profile-support-wide">
                      <span>Mensagem</span>
                      <textarea id="profileSupportNote" rows={4} maxLength={220} placeholder="Descreva o problema para o admin local."></textarea>
                    </label>
                  </div>
                  <div className="marker-form-meta">
                    <span id="profileSupportStatus">Abra um ticket local para aparecer no admin.</span>
                    <button type="submit">Abrir ticket</button>
                  </div>
                </form>
                <div id="profileTicketList" className="profile-history-list"></div>
              </section>

              <section className="profile-panel">
                <div className="utility-panel-head">
                  <strong>Inventario e resgates</strong>
                  <small id="profileInventoryCount">0 itens</small>
                </div>
                <div id="profileInventoryList" className="profile-history-list"></div>
              </section>
            </section>
          </section>

          {/* ADMIN */}
          <section id="page-admin" className="page utility-page" data-page="admin">
            <div className="admin-shell">
              <aside className="admin-rail">
                <div className="admin-rail-head">
                  <div className="admin-rail-badge">S</div>
                  <div>
                    <p>Control node</p>
                    <h3>Dashboard</h3>
                  </div>
                </div>
                <nav className="admin-rail-nav" aria-label="Modulos administrativos">
                  <details className="admin-nav-group" data-admin-group="operacao" open>
                    <summary>Operacao</summary>
                    <button type="button" className="active" data-admin-section="dashboard"><span className="admin-nav-icon">D</span><span>Dashboard</span></button>
                    <button type="button" data-admin-section="pedidos"><span className="admin-nav-icon">P</span><span>Pedidos</span></button>
                    <button type="button" data-admin-section="produtos"><span className="admin-nav-icon">I</span><span>Produtos</span></button>
                    <button type="button" data-admin-section="estoque"><span className="admin-nav-icon">E</span><span>Estoque</span></button>
                    <button type="button" data-admin-section="cupons"><span className="admin-nav-icon">U</span><span>Cupons</span></button>
                    <button type="button" data-admin-section="lootboxes"><span className="admin-nav-icon">L</span><span>Loot Boxes</span></button>
                  </details>
                  <details className="admin-nav-group" data-admin-group="gestao" open>
                    <summary>Gestao</summary>
                    <button type="button" data-admin-section="usuarios"><span className="admin-nav-icon">A</span><span>Usuarios</span></button>
                    <button type="button" data-admin-section="equipe"><span className="admin-nav-icon">Q</span><span>Equipe</span></button>
                    <button type="button" data-admin-section="suporte"><span className="admin-nav-icon">O</span><span>Suporte</span></button>
                  </details>
                  <details className="admin-nav-group" data-admin-group="relacionamento" open>
                    <summary>Relacionamento</summary>
                    <button type="button" data-admin-section="streamers"><span className="admin-nav-icon">S</span><span>Streamers</span></button>
                    <button type="button" data-admin-section="parcerias"><span className="admin-nav-icon">R</span><span>Parcerias</span></button>
                  </details>
                </nav>
                <section className="admin-rail-card">
                  <small id="adminStatusLabel">Aguardando acesso</small>
                  <strong>Conta admin local</strong>
                  <p id="adminDefaultEmail">admin@sucatao.local</p>
                  <span id="adminDefaultPassword">Senha: admin123</span>
                </section>
              </aside>

              <div className="admin-main">
                <header className="admin-topbar">
                  <div className="admin-page-head">
                    <div>
                      <p>Marketplace command center</p>
                      <h2 id="adminSectionTitle">Dashboard administrativo</h2>
                      <span id="adminSectionSubtitle" className="admin-subtitle">Painel local para operacao, usuarios e economia do Sucatao.</span>
                    </div>
                  </div>
                  <div className="admin-actions">
                    <button type="button" className="admin-action-icon" aria-label="Alertas">o</button>
                    <label className="admin-search">
                      <span>Buscar</span>
                      <input id="adminSearchInput" type="text" placeholder="Usuarios, itens, economia" />
                    </label>
                    <button id="adminCreateUserButton" type="button" className="admin-range-chip">Novo usuario</button>
                    <button type="button" className="admin-range-chip">Ultimos 7 dias</button>
                    <button id="adminResetOpsButton" type="button" className="admin-range-chip">Restaurar modulos</button>
                    <button id="adminExportButton" type="button" className="admin-download-button">Exportar relatorio</button>
                  </div>
                </header>

                <div className="admin-roster-pill">
                  <span id="adminRosterCount">0 contas</span>
                </div>

                <section id="adminDepartmentGuide" className="admin-panel admin-department-guide" data-admin-panel="pedidos produtos estoque cupons lootboxes streamers parcerias suporte equipe usuarios">
                  <div className="admin-panel-head">
                    <div>
                      <p>Departamento ativo</p>
                      <h3 id="adminDepartmentGuideTitle">Resumo do modulo</h3>
                    </div>
                    <span id="adminDepartmentGuideTag">Operacao</span>
                  </div>
                  <div id="adminDepartmentCards" className="admin-department-cards"></div>
                </section>

                <section className="admin-workspace-grid" data-admin-panel="pedidos produtos estoque cupons lootboxes streamers parcerias suporte equipe usuarios">
                  <article className="admin-panel">
                    <div className="admin-panel-head">
                      <div>
                        <p>Workspace operacional</p>
                        <h3 id="adminWorkspaceFormTitle">Editor do modulo</h3>
                      </div>
                      <span id="adminWorkspaceFormMeta">Ajustes locais</span>
                    </div>
                    <form id="adminWorkspaceForm" className="admin-workspace-form"></form>
                  </article>

                  <article className="admin-panel">
                    <div className="admin-panel-head">
                      <div>
                        <p>Pulse do modulo</p>
                        <h3 id="adminWorkspaceStatsTitle">Resumo rapido</h3>
                      </div>
                      <span id="adminWorkspaceStatsMeta">Local</span>
                    </div>
                    <div id="adminWorkspaceStats" className="admin-workspace-stats"></div>
                  </article>
                </section>

                <section className="admin-panel" data-admin-panel="pedidos produtos estoque cupons lootboxes streamers parcerias suporte equipe usuarios">
                  <div className="admin-panel-head">
                    <div>
                      <p>Fila operacional</p>
                      <h3 id="adminWorkspaceListTitle">Registros do modulo</h3>
                    </div>
                    <span id="adminWorkspaceListMeta">0 registros</span>
                  </div>
                  <div id="adminWorkspaceList" className="admin-workspace-list"></div>
                </section>

                <section id="adminMetricGrid" className="admin-metric-grid" aria-label="Metricas do admin" data-admin-panel="dashboard"></section>

                <section className="admin-dashboard-focus-grid" data-admin-panel="dashboard">
                  <article className="admin-panel">
                    <div className="admin-panel-head">
                      <div>
                        <p>Ops watch</p>
                        <h3>Alertas operacionais</h3>
                      </div>
                      <span id="adminAlertCount">0 alertas</span>
                    </div>
                    <div id="adminAlertList" className="admin-workspace-list"></div>
                  </article>

                  <article className="admin-panel">
                    <div className="admin-panel-head">
                      <div>
                        <p>Module jump</p>
                        <h3>Atalhos do painel</h3>
                      </div>
                      <span>Dashboard</span>
                    </div>
                    <div id="adminQuickLinks" className="admin-department-cards"></div>
                  </article>
                </section>

                <section className="admin-dashboard-focus-grid" data-admin-panel="dashboard">
                  <article className="admin-panel">
                    <div className="admin-panel-head">
                      <div>
                        <p>Campaign watch</p>
                        <h3>Beneficios monitorados</h3>
                      </div>
                      <span id="adminCampaignCount">0 ativos</span>
                    </div>
                    <div id="adminCampaignList" className="admin-workspace-list"></div>
                  </article>

                  <article className="admin-panel">
                    <div className="admin-panel-head">
                      <div>
                        <p>Stock watch</p>
                        <h3>Reposicao imediata</h3>
                      </div>
                      <span id="adminStockWatchCount">0 itens</span>
                    </div>
                    <div id="adminStockWatchList" className="admin-workspace-list"></div>
                  </article>
                </section>

                <section className="admin-analytics-grid" data-admin-panel="dashboard pedidos">
                  <article className="admin-panel admin-panel-chart" data-admin-panel="dashboard pedidos">
                    <div className="admin-panel-head">
                      <div>
                        <p>Monthly sales</p>
                        <h3 id="adminChartTitle">Fluxo mensal</h3>
                      </div>
                      <span id="adminChartTotal">0</span>
                    </div>
                    <div id="adminRevenueChart" className="admin-line-chart"></div>
                  </article>

                  <article className="admin-panel" data-admin-panel="dashboard produtos">
                    <div className="admin-panel-head">
                      <div>
                        <p>Catalog mix</p>
                        <h3>Distribuicao por tipo</h3>
                      </div>
                      <span id="adminRoleCount">0</span>
                    </div>
                    <div id="adminCategoryChart" className="admin-donut-chart"></div>
                    <div id="adminCategoryLegend" className="admin-donut-legend"></div>
                  </article>
                </section>

                <section className="admin-secondary-grid" data-admin-panel="dashboard pedidos produtos">
                  <article className="admin-panel" data-admin-panel="dashboard produtos">
                    <div className="admin-panel-head">
                      <div>
                        <p>Revenue trend</p>
                        <h3>Itens mais valiosos</h3>
                      </div>
                      <span id="adminTopItemLabel">Top 5</span>
                    </div>
                    <div id="adminTopItemsList" className="profile-history-list"></div>
                  </article>

                  <article className="admin-panel" data-admin-panel="dashboard pedidos suporte equipe usuarios">
                    <div className="admin-panel-head">
                      <div>
                        <p>Recent activity</p>
                        <h3>Historico consolidado</h3>
                      </div>
                      <span id="adminHistoryCount">0</span>
                    </div>
                    <div id="adminActivityFeed" className="profile-history-list"></div>
                  </article>
                </section>

                <section className="admin-tertiary-grid" data-admin-panel="dashboard usuarios equipe pedidos">
                  <article className="admin-panel" data-admin-panel="dashboard equipe usuarios">
                    <div className="admin-panel-head">
                      <div>
                        <p>Roster pulse</p>
                        <h3>Usuarios locais</h3>
                      </div>
                      <span id="adminUserCount">0</span>
                    </div>
                    <div id="adminRecentUsersList" className="profile-history-list"></div>
                  </article>

                  <article className="admin-panel" data-admin-panel="dashboard pedidos cupons lootboxes">
                    <div className="admin-panel-head">
                      <div>
                        <p>Economia local</p>
                        <h3>Canais de gasto</h3>
                      </div>
                      <span id="adminInventoryCount">0</span>
                    </div>
                    <div id="adminChannelBars" className="admin-bar-list"></div>
                  </article>
                </section>

                <section className="admin-tertiary-grid admin-bottom-grid" data-admin-panel="dashboard estoque equipe usuarios">
                  <article className="admin-panel" data-admin-panel="dashboard">
                    <div className="admin-panel-head">
                      <div>
                        <p>Mapa operacional</p>
                        <h3>Estado do conteudo</h3>
                      </div>
                      <span id="adminMapCountLabel">0 mapas</span>
                    </div>
                    <div id="adminMapStatusList" className="admin-status-grid"></div>
                  </article>

                  <article className="admin-panel" data-admin-panel="dashboard usuarios equipe estoque">
                    <div className="admin-panel-head">
                      <div>
                        <p>Roster completo</p>
                        <h3>Usuarios cadastrados</h3>
                      </div>
                      <span id="adminAdminCount">0 admins</span>
                    </div>
                    <div id="adminUserList" className="profile-history-list"></div>
                  </article>
                </section>

                <section className="admin-panel" data-admin-panel="dashboard cupons lootboxes produtos">
                  <div className="admin-panel-head">
                    <div>
                      <p>Home curation</p>
                      <h3>Curadoria da home e tarefas</h3>
                    </div>
                    <span>Visivel no site</span>
                  </div>
                  <form id="adminContentForm" className="admin-content-form">
                    <div className="admin-content-grid">
                      <section className="admin-content-block">
                        <strong>Tarefas diarias</strong>
                        <div className="admin-task-editor">
                          <label><span>Tarefa 1</span><input id="adminTaskTitle0" type="text" /></label>
                          <label><span>Pontos</span><input id="adminTaskPoints0" type="number" min={0} step={1} /></label>
                          <label className="admin-content-wide"><span>Dica</span><input id="adminTaskHint0" type="text" /></label>
                          <label><span>Tarefa 2</span><input id="adminTaskTitle1" type="text" /></label>
                          <label><span>Pontos</span><input id="adminTaskPoints1" type="number" min={0} step={1} /></label>
                          <label className="admin-content-wide"><span>Dica</span><input id="adminTaskHint1" type="text" /></label>
                          <label><span>Tarefa 3</span><input id="adminTaskTitle2" type="text" /></label>
                          <label><span>Pontos</span><input id="adminTaskPoints2" type="number" min={0} step={1} /></label>
                          <label className="admin-content-wide"><span>Dica</span><input id="adminTaskHint2" type="text" /></label>
                          <label><span>Tarefa 4</span><input id="adminTaskTitle3" type="text" /></label>
                          <label><span>Pontos</span><input id="adminTaskPoints3" type="number" min={0} step={1} /></label>
                          <label className="admin-content-wide"><span>Dica</span><input id="adminTaskHint3" type="text" /></label>
                        </div>
                      </section>
                      <section className="admin-content-block">
                        <strong>Marketplace em destaque</strong>
                        <div className="admin-select-stack">
                          <select id="adminFeaturedTrade0"></select>
                          <select id="adminFeaturedTrade1"></select>
                          <select id="adminFeaturedTrade2"></select>
                          <select id="adminFeaturedTrade3"></select>
                        </div>
                      </section>
                      <section className="admin-content-block">
                        <strong>Itens em destaque</strong>
                        <div className="admin-select-stack">
                          <select id="adminFeaturedItem0"></select>
                          <select id="adminFeaturedItem1"></select>
                          <select id="adminFeaturedItem2"></select>
                          <select id="adminFeaturedItem3"></select>
                        </div>
                      </section>
                      <section className="admin-content-block">
                        <strong>Intel recomendada</strong>
                        <div className="admin-select-stack">
                          <select id="adminFeaturedMap0"></select>
                          <select id="adminFeaturedMap1"></select>
                          <select id="adminFeaturedMap2"></select>
                          <select id="adminFeaturedMap3"></select>
                        </div>
                      </section>
                    </div>
                    <div className="marker-form-meta">
                      <span id="adminContentStatus">Tudo aqui altera a home local deste pacote offline.</span>
                      <div className="admin-content-actions">
                        <button id="adminContentResetButton" type="button" className="admin-user-danger">Restaurar padrao</button>
                        <button type="submit">Salvar curadoria</button>
                      </div>
                    </div>
                  </form>
                </section>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* MODALS */}
      <div id="adminUserModal" className="modal-backdrop" hidden>
        <form id="adminUserForm" className="marker-modal admin-user-modal" aria-labelledby="adminUserModalTitle">
          <button id="adminUserModalClose" className="modal-close" type="button" aria-label="Fechar editor admin">x</button>
          <p className="modal-kicker">Controle administrativo</p>
          <h2 id="adminUserModalTitle">Editar usuario</h2>
          <div className="marker-form-grid">
            <label><span>Nome</span><input id="adminUserNameInput" type="text" maxLength={48} required /></label>
            <label><span>E-mail</span><input id="adminUserEmailInput" type="email" /></label>
            <label><span>Saldo real</span><input id="adminUserCashInput" type="number" min={0} step={1} required /></label>
            <label><span>Pontos do site</span><input id="adminUserPointsInput" type="number" min={0} step={1} required /></label>
            <label>
              <span>Cargo</span>
              <select id="adminUserRoleInput">
                <option value="user">Usuario</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label><span>Senha local</span><input id="adminUserPasswordInput" type="text" maxLength={64} placeholder="Senha local do usuario" /></label>
          </div>
          <div className="admin-user-modal-actions">
            <button id="adminClearHistoryButton" type="button" className="admin-user-danger">Limpar historico</button>
            <button id="adminClearInventoryButton" type="button" className="admin-user-danger">Limpar inventario</button>
            <button id="adminDeleteUserButton" type="button" className="admin-user-danger">Excluir conta</button>
          </div>
          <div className="marker-form-meta">
            <span id="adminUserModalStatus">Ajustes salvos no navegador deste pacote offline.</span>
            <button type="submit">Salvar usuario</button>
          </div>
        </form>
      </div>

      <div id="itemModal" className="modal-backdrop" hidden>
        <article className="item-modal" role="dialog" aria-modal={true} aria-labelledby="modalTitle">
          <button id="modalClose" className="modal-close" type="button" aria-label="Fechar detalhe">x</button>
          <div className="modal-media" id="modalMedia"></div>
          <div className="modal-content">
            <p className="modal-kicker" id="modalKicker">Item</p>
            <h2 id="modalTitle">Item</h2>
            <p id="modalDescription" className="modal-description"></p>
            <div className="modal-stats">
              <span><small>Valor real</small><strong id="modalBaseValue">N/D</strong></span>
              <span><small>Pontos do site</small><strong id="modalTradeValue">N/D</strong></span>
              <span><small>Peso</small><strong id="modalWeight">N/D</strong></span>
              <span><small>Stack</small><strong id="modalStack">N/D</strong></span>
            </div>
            <div className="item-purchase-actions">
              <button id="redeemPointsButton" type="button">Resgatar com pontos</button>
              <button id="buyCashButton" type="button">Comprar com saldo real</button>
            </div>
            <p id="modalPurchaseStatus" className="modal-purchase-status">Entre em uma conta local para salvar compras e resgates.</p>
            <div id="modalFlags" className="modal-flags"></div>
          </div>
        </article>
      </div>

      <div id="markerModal" className="modal-backdrop" hidden>
        <form id="markerForm" className="marker-modal" aria-labelledby="markerModalTitle">
          <button id="markerModalClose" className="modal-close" type="button" aria-label="Fechar editor">x</button>
          <p className="modal-kicker">Novo ping</p>
          <h2 id="markerModalTitle">Salvar marcador</h2>
          <div className="marker-form-grid">
            <label><span>Tipo</span><select id="markerTypeInput"></select></label>
            <label><span>Titulo</span><input id="markerTitleInput" type="text" maxLength={48} placeholder="Ex: Caixa rara" required /></label>
            <label className="marker-form-note"><span>Nota</span><textarea id="markerNoteInput" rows={4} maxLength={180} placeholder="Detalhe rapido do ping"></textarea></label>
          </div>
          <div className="marker-form-meta">
            <span id="markerPositionPreview">x 0 / y 0</span>
            <button type="submit">Salvar ping</button>
          </div>
        </form>
      </div>

      <div id="importModal" className="modal-backdrop" hidden>
        <form id="importForm" className="marker-modal" aria-labelledby="importModalTitle">
          <button id="importModalClose" className="modal-close" type="button" aria-label="Fechar importacao">x</button>
          <p className="modal-kicker">Importar pings</p>
          <h2 id="importModalTitle">Colar JSON</h2>
          <label className="import-field">
            <span>Dados</span>
            <textarea id="importMarkersInput" rows={10} placeholder="Cole aqui o JSON exportado"></textarea>
          </label>
          <div className="marker-form-meta">
            <span id="importStatus">Substitui apenas pings customizados</span>
            <button type="submit">Importar pings</button>
          </div>
        </form>
      </div>

      <div id="routeModal" className="modal-backdrop" hidden>
        <form id="routeForm" className="marker-modal" aria-labelledby="routeModalTitle">
          <button id="routeModalClose" className="modal-close" type="button" aria-label="Fechar editor de rota">x</button>
          <p className="modal-kicker">Nova rota</p>
          <h2 id="routeModalTitle">Salvar rota</h2>
          <div className="marker-form-grid">
            <label><span>Tipo</span><select id="routeTypeInput"></select></label>
            <label><span>Titulo</span><input id="routeTitleInput" type="text" maxLength={48} placeholder="Ex: Farm rapido" required /></label>
            <label className="marker-form-note"><span>Nota</span><textarea id="routeNoteInput" rows={4} maxLength={180} placeholder="Detalhe rapido da rota"></textarea></label>
          </div>
          <div className="marker-form-meta">
            <span id="routePointPreview">0 pontos</span>
            <button type="submit">Salvar rota</button>
          </div>
        </form>
      </div>

      <div id="authModal" className="modal-backdrop" hidden>
        <form id="authForm" className="marker-modal auth-modal" aria-labelledby="authModalTitle">
          <button id="authModalClose" className="modal-close" type="button" aria-label="Fechar login">x</button>
          <p className="modal-kicker">Conta local</p>
          <h2 id="authModalTitle">Entrar no Sucatao</h2>
          <div className="auth-toggle-row">
            <button id="authModeLoginButton" type="button" className="auth-mode-button active">Entrar</button>
            <button id="authModeRegisterButton" type="button" className="auth-mode-button">Criar conta</button>
          </div>
          <div className="marker-form-grid">
            <label id="authNameField"><span>Nome</span><input id="authNameInput" type="text" maxLength={32} placeholder="Seu nome no site" /></label>
            <label><span>E-mail</span><input id="authEmailInput" type="email" maxLength={80} placeholder="voce@email.com" required /></label>
            <label><span>Senha</span><input id="authPasswordInput" type="password" maxLength={48} placeholder="Sua senha local" required /></label>
          </div>
          <div className="marker-form-meta auth-form-meta">
            <span id="authStatusMessage">Os dados ficam salvos apenas no navegador deste pacote offline.</span>
            <button id="authSubmitButton" type="submit">Entrar</button>
          </div>
        </form>
      </div>

      <div id="appToast" className="app-toast" hidden></div>

      <Script src="/data/arc-data.js" strategy="beforeInteractive" />
      <Script src="/data/map-markers.js" strategy="beforeInteractive" />
      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
