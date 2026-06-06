const data = window.ARC_DATA || { items: [], bots: [], maps: [], trades: [] };
data.items = Array.isArray(data.items) ? data.items : [];
data.bots = Array.isArray(data.bots) ? data.bots : [];
data.maps = Array.isArray(data.maps) ? data.maps : [];
data.trades = Array.isArray(data.trades)
  ? data.trades
  : Array.isArray(data.trades?.value)
    ? data.trades.value
    : Object.values(data.trades || {});

const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Unknown'];
const rarityLabels = {
  Common: 'Comum',
  Uncommon: 'Incomum',
  Rare: 'Raro',
  Epic: 'Epico',
  Legendary: 'Lendario',
  Unknown: 'Sem raridade',
};
const rarityColors = {
  Common: '#a9b1bd',
  Uncommon: '#3df28b',
  Rare: '#5fa8ff',
  Epic: '#b477ff',
  Legendary: '#ff9d1b',
  Unknown: '#687386',
};

const markerCategories = window.ARC_MARKER_CATEGORIES || {};
const baseMapMarkers = Array.isArray(window.ARC_MAP_MARKERS) ? window.ARC_MAP_MARKERS : [];
const routeCategories = window.ARC_ROUTE_CATEGORIES || {};
const baseMapRoutes = Array.isArray(window.ARC_MAP_ROUTES) ? window.ARC_MAP_ROUTES : [];
const fallbackMarkerCategory = { label: 'Intel', color: '#00d9ff' };
const markerStorageKey = 'sucatao.arc.customMapMarkers.v1';
const hiddenMarkerStorageKey = 'sucatao.arc.hiddenMapMarkers.v1';
const routeStorageKey = 'sucatao.arc.customMapRoutes.v1';
const mapPreferencesStorageKey = 'sucatao.arc.mapPreferences.v1';
const itemFavoritesStorageKey = 'sucatao.arc.itemFavorites.v1';
const dailyTaskStorageKey = 'sucatao.arc.dailyTasks.v1';
const walletStorageKey = 'sucatao.arc.wallet.v1';
const authUsersStorageKey = 'sucatao.arc.authUsers.v1';
const authSessionStorageKey = 'sucatao.arc.authSession.v1';
const historyStorageKey = 'sucatao.arc.history.v1';
const inventoryStorageKey = 'sucatao.arc.inventory.v1';
const adminContentStorageKey = 'sucatao.arc.adminContent.v1';
const adminOperationsStorageKey = 'sucatao.arc.adminOps.v1';
const couponRedeemsStorageKey = 'sucatao.arc.couponRedeems.v1';
const adminUiStorageKey = 'sucatao.arc.adminUi.v1';
const defaultAdminEmail = 'admin@sucatao.local';
const defaultAdminPassword = 'admin123';
const defaultDailyTaskDefinitions = [
  { id: 'extract-route', title: 'Marcar 1 rota de extracao', points: 80, hint: 'Use a tela de mapas para salvar uma rota curta.' },
  { id: 'favorite-loot', title: 'Favoritar 3 itens de loot', points: 50, hint: 'Monte sua shortlist de farm no catalogo.' },
  { id: 'check-trades', title: 'Revisar 5 ofertas do marketplace', points: 70, hint: 'Passe na aba Trades e compare custo e retorno.' },
  { id: 'craft-plan', title: 'Planejar 2 crafts', points: 60, hint: 'Consulte materiais e saidas na aba Crafting.' },
];
const mapPresets = [
  { id: 'all', label: 'Tudo' },
  { id: 'loot', label: 'Loot', markerTypes: ['loot'], routeTypes: [] },
  { id: 'extraction', label: 'Extracao', markerTypes: ['extract', 'extraction'], routeTypes: ['extract', 'extraction'] },
  { id: 'risk', label: 'Risco', markerTypes: ['danger', 'risk'], routeTypes: ['danger', 'risk'] },
  { id: 'routes', label: 'Rotas', markerTypes: [], routeTypes: 'all', showMarkers: false, showRoutes: true },
  { id: 'mine', label: 'Meus pings', sourceFilter: 'custom' },
];

let authUsers = loadAuthUsers();
let currentSession = loadAuthSession();
let customMapMarkers = loadCustomMapMarkers();
let hiddenMarkerIds = loadHiddenMarkerIds();
let customMapRoutes = loadCustomMapRoutes();
const initialMapPreferences = loadMapPreferences();
let favoriteItemIds = loadFavoriteItemIds();
let dailyTaskState = loadDailyTaskState();
let walletState = loadWalletState();
let purchaseHistory = loadPurchaseHistory();
let inventoryState = loadInventoryState();
let redeemedCouponsState = loadRedeemedCouponsState();
let adminContentConfig = loadAdminContentConfig();
let adminOperationsConfig = loadAdminOperationsConfig();
const initialAdminUi = loadAdminUiState();
let authMode = 'login';
let activeModalItemId = '';
let toastTimeoutId = 0;
let adminEditingUserEmail = '';
let adminUserModalMode = 'edit';

const state = {
  query: '',
  craftingQuery: '',
  recyclingQuery: '',
  tradeQuery: '',
  tradeTrader: 'all',
  arcQuery: '',
  arcThreat: 'all',
  favoritesOnly: false,
  rarity: 'all',
  type: 'all',
  sort: 'value-desc',
  selectedMapId: initialMapPreferences.selectedMapId || data.maps[0]?.id || '',
  mapQuery: initialMapPreferences.mapQuery || '',
  markerTypes: new Set(initialMapPreferences.markerTypes || Object.keys(markerCategories)),
  routeTypes: new Set(initialMapPreferences.routeTypes || Object.keys(routeCategories)),
  showMarkers: initialMapPreferences.showMarkers ?? true,
  showRoutes: initialMapPreferences.showRoutes ?? true,
  sourceFilter: initialMapPreferences.sourceFilter || 'all',
  mapPreset: initialMapPreferences.mapPreset || 'all',
  selectedMarkerId: '',
  selectedRouteId: '',
  isAddingMarker: false,
  isAddingRoute: false,
  draftMarker: null,
  draftRoutePoints: [],
  editingMarkerId: '',
  repositionMarkerId: '',
  mapZoom: initialMapPreferences.mapZoom || 1,
  adminQuery: initialAdminUi.query || '',
  adminSection: initialAdminUi.section || 'dashboard',
  adminEditorId: '',
  profileSupportContext: null,
};

const els = {
  statItems: document.querySelector('#statItems'),
  statBots: document.querySelector('#statBots'),
  statMaps: document.querySelector('#statMaps'),
  statTrades: document.querySelector('#statTrades'),
  authStatusLabel: document.querySelector('#authStatusLabel'),
  authUserLabel: document.querySelector('#authUserLabel'),
  authActionButton: document.querySelector('#authActionButton'),
  logoutButton: document.querySelector('#logoutButton'),
  adminNavLink: document.querySelector('#adminNavLink'),
  adminSearchInput: document.querySelector('#adminSearchInput'),
  adminCreateUserButton: document.querySelector('#adminCreateUserButton'),
  adminResetOpsButton: document.querySelector('#adminResetOpsButton'),
  adminExportButton: document.querySelector('#adminExportButton'),
  dailyResetLabel: document.querySelector('#dailyResetLabel'),
  dailyDoneCount: document.querySelector('#dailyDoneCount'),
  rewardPointCount: document.querySelector('#rewardPointCount'),
  rewardBonusLabel: document.querySelector('#rewardBonusLabel'),
  dailyTaskList: document.querySelector('#dailyTaskList'),
  marketSpotlightGrid: document.querySelector('#marketSpotlightGrid'),
  lootSpotlightGrid: document.querySelector('#lootSpotlightGrid'),
  intelSpotlightGrid: document.querySelector('#intelSpotlightGrid'),
  searchInput: document.querySelector('#searchInput'),
  sortSelect: document.querySelector('#sortSelect'),
  favoriteToggleButton: document.querySelector('#favoriteToggleButton'),
  rarityDropdown: document.querySelector('#rarityDropdown'),
  typeDropdown: document.querySelector('#typeDropdown'),
  raritySummary: document.querySelector('#raritySummary'),
  typeSummary: document.querySelector('#typeSummary'),
  rarityFilters: document.querySelector('#rarityFilters'),
  typeFilters: document.querySelector('#typeFilters'),
  itemGrid: document.querySelector('#itemGrid'),
  visibleCount: document.querySelector('#visibleCount'),
  totalCount: document.querySelector('#totalCount'),
  activeSort: document.querySelector('#activeSort'),
  botList: document.querySelector('#botList'),
  mapPageCount: document.querySelector('#mapPageCount'),
  mapPageList: document.querySelector('#mapPageList'),
  craftingSearchInput: document.querySelector('#craftingSearchInput'),
  craftingCraftableCount: document.querySelector('#craftingCraftableCount'),
  craftingSourceCount: document.querySelector('#craftingSourceCount'),
  craftingRecipeCount: document.querySelector('#craftingRecipeCount'),
  craftingSourceLabel: document.querySelector('#craftingSourceLabel'),
  craftingOutputLabel: document.querySelector('#craftingOutputLabel'),
  craftingSourceGrid: document.querySelector('#craftingSourceGrid'),
  craftingOutputGrid: document.querySelector('#craftingOutputGrid'),
  recyclingSearchInput: document.querySelector('#recyclingSearchInput'),
  recyclingItemCount: document.querySelector('#recyclingItemCount'),
  recyclingKnownCount: document.querySelector('#recyclingKnownCount'),
  recyclingValueCount: document.querySelector('#recyclingValueCount'),
  recyclingResultLabel: document.querySelector('#recyclingResultLabel'),
  recyclingGrid: document.querySelector('#recyclingGrid'),
  tradeSearchInput: document.querySelector('#tradeSearchInput'),
  tradeOfferCount: document.querySelector('#tradeOfferCount'),
  tradeTraderCount: document.querySelector('#tradeTraderCount'),
  tradeVisibleCount: document.querySelector('#tradeVisibleCount'),
  tradeTraderFilters: document.querySelector('#tradeTraderFilters'),
  tradeResultLabel: document.querySelector('#tradeResultLabel'),
  tradeGrid: document.querySelector('#tradeGrid'),
  arcSearchInput: document.querySelector('#arcSearchInput'),
  arcVisibleCount: document.querySelector('#arcVisibleCount'),
  arcDropCount: document.querySelector('#arcDropCount'),
  arcThreatFilters: document.querySelector('#arcThreatFilters'),
  selectedMapStatus: document.querySelector('#selectedMapStatus'),
  selectedMapTitle: document.querySelector('#selectedMapTitle'),
  selectedMapBadge: document.querySelector('#selectedMapBadge'),
  selectedMapMedia: document.querySelector('#selectedMapMedia'),
  selectedMapDescription: document.querySelector('#selectedMapDescription'),
  markerCount: document.querySelector('#markerCount'),
  mapFilterDropdown: document.querySelector('#mapFilterDropdown'),
  mapFilterSummary: document.querySelector('#mapFilterSummary'),
  mapSearchInput: document.querySelector('#mapSearchInput'),
  mapPresetFilters: document.querySelector('#mapPresetFilters'),
  markerFilters: document.querySelector('#markerFilters'),
  routeFilters: document.querySelector('#routeFilters'),
  showMarkersInput: document.querySelector('#showMarkersInput'),
  showRoutesInput: document.querySelector('#showRoutesInput'),
  sourceFilterSelect: document.querySelector('#sourceFilterSelect'),
  clearMapFiltersButton: document.querySelector('#clearMapFiltersButton'),
  markerDetail: document.querySelector('#markerDetail'),
  addMarkerButton: document.querySelector('#addMarkerButton'),
  addRouteButton: document.querySelector('#addRouteButton'),
  finishRouteButton: document.querySelector('#finishRouteButton'),
  cancelMarkerButton: document.querySelector('#cancelMarkerButton'),
  markerModal: document.querySelector('#markerModal'),
  markerModalClose: document.querySelector('#markerModalClose'),
  markerForm: document.querySelector('#markerForm'),
  markerTypeInput: document.querySelector('#markerTypeInput'),
  markerTitleInput: document.querySelector('#markerTitleInput'),
  markerNoteInput: document.querySelector('#markerNoteInput'),
  markerPositionPreview: document.querySelector('#markerPositionPreview'),
  restoreMarkersButton: document.querySelector('#restoreMarkersButton'),
  exportMarkersButton: document.querySelector('#exportMarkersButton'),
  importMarkersButton: document.querySelector('#importMarkersButton'),
  saveMarkersButton: document.querySelector('#saveMarkersButton'),
  mapSyncStatus: document.querySelector('#mapSyncStatus'),
  markerList: document.querySelector('#markerList'),
  mapZoomLabel: document.querySelector('#mapZoomLabel'),
  zoomOutButton: document.querySelector('#zoomOutButton'),
  zoomResetButton: document.querySelector('#zoomResetButton'),
  zoomInButton: document.querySelector('#zoomInButton'),
  importModal: document.querySelector('#importModal'),
  importModalClose: document.querySelector('#importModalClose'),
  importForm: document.querySelector('#importForm'),
  importMarkersInput: document.querySelector('#importMarkersInput'),
  importStatus: document.querySelector('#importStatus'),
  routeModal: document.querySelector('#routeModal'),
  routeModalClose: document.querySelector('#routeModalClose'),
  routeForm: document.querySelector('#routeForm'),
  routeTypeInput: document.querySelector('#routeTypeInput'),
  routeTitleInput: document.querySelector('#routeTitleInput'),
  routeNoteInput: document.querySelector('#routeNoteInput'),
  routePointPreview: document.querySelector('#routePointPreview'),
  arcCount: document.querySelector('#arcCount'),
  arcGrid: document.querySelector('#arcGrid'),
  resetButton: document.querySelector('#resetButton'),
  itemModal: document.querySelector('#itemModal'),
  modalClose: document.querySelector('#modalClose'),
  modalMedia: document.querySelector('#modalMedia'),
  modalKicker: document.querySelector('#modalKicker'),
  modalTitle: document.querySelector('#modalTitle'),
  modalDescription: document.querySelector('#modalDescription'),
  modalBaseValue: document.querySelector('#modalBaseValue'),
  modalTradeValue: document.querySelector('#modalTradeValue'),
  modalWeight: document.querySelector('#modalWeight'),
  modalStack: document.querySelector('#modalStack'),
  modalFlags: document.querySelector('#modalFlags'),
  profileStatusLabel: document.querySelector('#profileStatusLabel'),
  profileAvatar: document.querySelector('#profileAvatar'),
  profileName: document.querySelector('#profileName'),
  profileEmail: document.querySelector('#profileEmail'),
  profileLoginButton: document.querySelector('#profileLoginButton'),
  profileLogoutButton: document.querySelector('#profileLogoutButton'),
  profileCashBalance: document.querySelector('#profileCashBalance'),
  profilePointBalance: document.querySelector('#profilePointBalance'),
  profileRedeemableCount: document.querySelector('#profileRedeemableCount'),
  profileDailyResetLabel: document.querySelector('#profileDailyResetLabel'),
  profileDailyDoneCount: document.querySelector('#profileDailyDoneCount'),
  profileDailyPointCount: document.querySelector('#profileDailyPointCount'),
  profileDailyBonusLabel: document.querySelector('#profileDailyBonusLabel'),
  profileFavoriteCount: document.querySelector('#profileFavoriteCount'),
  profileVisibleItemCount: document.querySelector('#profileVisibleItemCount'),
  profileTradeCount: document.querySelector('#profileTradeCount'),
  profileReadyMapCount: document.querySelector('#profileReadyMapCount'),
  profileCouponStatus: document.querySelector('#profileCouponStatus'),
  profileCouponInput: document.querySelector('#profileCouponInput'),
  profileCouponButton: document.querySelector('#profileCouponButton'),
  profileCouponList: document.querySelector('#profileCouponList'),
  profileLootboxList: document.querySelector('#profileLootboxList'),
  profileHistoryCount: document.querySelector('#profileHistoryCount'),
  profileHistoryList: document.querySelector('#profileHistoryList'),
  profileOrderCount: document.querySelector('#profileOrderCount'),
  profilePendingOrderCount: document.querySelector('#profilePendingOrderCount'),
  profileProcessingOrderCount: document.querySelector('#profileProcessingOrderCount'),
  profileDeliveredOrderCount: document.querySelector('#profileDeliveredOrderCount'),
  profileOrderList: document.querySelector('#profileOrderList'),
  profileTicketCount: document.querySelector('#profileTicketCount'),
  profileOpenTicketCount: document.querySelector('#profileOpenTicketCount'),
  profileReviewTicketCount: document.querySelector('#profileReviewTicketCount'),
  profileResolvedTicketCount: document.querySelector('#profileResolvedTicketCount'),
  profileSupportForm: document.querySelector('#profileSupportForm'),
  profileSupportSubject: document.querySelector('#profileSupportSubject'),
  profileSupportPriority: document.querySelector('#profileSupportPriority'),
  profileSupportNote: document.querySelector('#profileSupportNote'),
  profileSupportStatus: document.querySelector('#profileSupportStatus'),
  profileTicketList: document.querySelector('#profileTicketList'),
  profileInventoryCount: document.querySelector('#profileInventoryCount'),
  profileInventoryList: document.querySelector('#profileInventoryList'),
  adminStatusLabel: document.querySelector('#adminStatusLabel'),
  adminSectionTitle: document.querySelector('#adminSectionTitle'),
  adminSectionSubtitle: document.querySelector('#adminSectionSubtitle'),
  adminDepartmentGuideTitle: document.querySelector('#adminDepartmentGuideTitle'),
  adminDepartmentGuideTag: document.querySelector('#adminDepartmentGuideTag'),
  adminDepartmentCards: document.querySelector('#adminDepartmentCards'),
  adminWorkspaceFormTitle: document.querySelector('#adminWorkspaceFormTitle'),
  adminWorkspaceFormMeta: document.querySelector('#adminWorkspaceFormMeta'),
  adminWorkspaceForm: document.querySelector('#adminWorkspaceForm'),
  adminWorkspaceStatsTitle: document.querySelector('#adminWorkspaceStatsTitle'),
  adminWorkspaceStatsMeta: document.querySelector('#adminWorkspaceStatsMeta'),
  adminWorkspaceStats: document.querySelector('#adminWorkspaceStats'),
  adminWorkspaceListTitle: document.querySelector('#adminWorkspaceListTitle'),
  adminWorkspaceListMeta: document.querySelector('#adminWorkspaceListMeta'),
  adminWorkspaceList: document.querySelector('#adminWorkspaceList'),
  adminMetricGrid: document.querySelector('#adminMetricGrid'),
  adminAlertCount: document.querySelector('#adminAlertCount'),
  adminAlertList: document.querySelector('#adminAlertList'),
  adminQuickLinks: document.querySelector('#adminQuickLinks'),
  adminCampaignCount: document.querySelector('#adminCampaignCount'),
  adminCampaignList: document.querySelector('#adminCampaignList'),
  adminStockWatchCount: document.querySelector('#adminStockWatchCount'),
  adminStockWatchList: document.querySelector('#adminStockWatchList'),
  adminChartTitle: document.querySelector('#adminChartTitle'),
  adminChartTotal: document.querySelector('#adminChartTotal'),
  adminRevenueChart: document.querySelector('#adminRevenueChart'),
  adminCategoryChart: document.querySelector('#adminCategoryChart'),
  adminCategoryLegend: document.querySelector('#adminCategoryLegend'),
  adminRecentUsersList: document.querySelector('#adminRecentUsersList'),
  adminTopItemLabel: document.querySelector('#adminTopItemLabel'),
  adminTopItemsList: document.querySelector('#adminTopItemsList'),
  adminChannelBars: document.querySelector('#adminChannelBars'),
  adminMapStatusList: document.querySelector('#adminMapStatusList'),
  adminActivityFeed: document.querySelector('#adminActivityFeed'),
  adminUserCount: document.querySelector('#adminUserCount'),
  adminRoleCount: document.querySelector('#adminRoleCount'),
  adminHistoryCount: document.querySelector('#adminHistoryCount'),
  adminInventoryCount: document.querySelector('#adminInventoryCount'),
  adminRosterCount: document.querySelector('#adminRosterCount'),
  adminMapCountLabel: document.querySelector('#adminMapCountLabel'),
  adminAdminCount: document.querySelector('#adminAdminCount'),
  adminUserList: document.querySelector('#adminUserList'),
  adminContentForm: document.querySelector('#adminContentForm'),
  adminContentStatus: document.querySelector('#adminContentStatus'),
  adminContentResetButton: document.querySelector('#adminContentResetButton'),
  adminUserModal: document.querySelector('#adminUserModal'),
  adminUserModalClose: document.querySelector('#adminUserModalClose'),
  adminUserForm: document.querySelector('#adminUserForm'),
  adminUserModalTitle: document.querySelector('#adminUserModalTitle'),
  adminUserNameInput: document.querySelector('#adminUserNameInput'),
  adminUserEmailInput: document.querySelector('#adminUserEmailInput'),
  adminUserCashInput: document.querySelector('#adminUserCashInput'),
  adminUserPointsInput: document.querySelector('#adminUserPointsInput'),
  adminUserRoleInput: document.querySelector('#adminUserRoleInput'),
  adminUserPasswordInput: document.querySelector('#adminUserPasswordInput'),
  adminUserModalStatus: document.querySelector('#adminUserModalStatus'),
  adminClearHistoryButton: document.querySelector('#adminClearHistoryButton'),
  adminClearInventoryButton: document.querySelector('#adminClearInventoryButton'),
  adminDeleteUserButton: document.querySelector('#adminDeleteUserButton'),
  authModal: document.querySelector('#authModal'),
  authModalClose: document.querySelector('#authModalClose'),
  authModalTitle: document.querySelector('#authModalTitle'),
  authForm: document.querySelector('#authForm'),
  authModeLoginButton: document.querySelector('#authModeLoginButton'),
  authModeRegisterButton: document.querySelector('#authModeRegisterButton'),
  authNameField: document.querySelector('#authNameField'),
  authNameInput: document.querySelector('#authNameInput'),
  authEmailInput: document.querySelector('#authEmailInput'),
  authPasswordInput: document.querySelector('#authPasswordInput'),
  authStatusMessage: document.querySelector('#authStatusMessage'),
  authSubmitButton: document.querySelector('#authSubmitButton'),
  redeemPointsButton: document.querySelector('#redeemPointsButton'),
  buyCashButton: document.querySelector('#buyCashButton'),
  modalPurchaseStatus: document.querySelector('#modalPurchaseStatus'),
  appToast: document.querySelector('#appToast'),
};

const adminTaskTitleInputs = [0, 1, 2, 3].map((index) => document.querySelector(`#adminTaskTitle${index}`));
const adminTaskPointsInputs = [0, 1, 2, 3].map((index) => document.querySelector(`#adminTaskPoints${index}`));
const adminTaskHintInputs = [0, 1, 2, 3].map((index) => document.querySelector(`#adminTaskHint${index}`));
const adminFeaturedTradeInputs = [0, 1, 2, 3].map((index) => document.querySelector(`#adminFeaturedTrade${index}`));
const adminFeaturedItemInputs = [0, 1, 2, 3].map((index) => document.querySelector(`#adminFeaturedItem${index}`));
const adminFeaturedMapInputs = [0, 1, 2, 3].map((index) => document.querySelector(`#adminFeaturedMap${index}`));

const adminPanelNodes = [...document.querySelectorAll('[data-admin-panel]')];
const adminSectionButtons = [...document.querySelectorAll('.admin-rail-nav [data-admin-section]')];
const adminNavGroups = [...document.querySelectorAll('.admin-nav-group')];
const adminSectionMeta = {
  dashboard: {
    title: 'Dashboard administrativo',
    subtitle: 'Visao geral da operacao, usuarios e economia local do Sucatao.',
    guideTitle: 'Centro de comando',
    guideTag: 'Resumo',
    cards: [
      ['Visao geral', 'Reune metricas, tendencia de atividade e saude do conteudo local.'],
      ['Atalhos', 'Use a lateral para abrir um departamento especifico sem misturar assuntos.'],
    ],
  },
  pedidos: {
    title: 'Pedidos e marketplace',
    subtitle: 'Controle ofertas, historico recente e fluxo economico das trocas locais.',
    guideTitle: 'Pedidos',
    guideTag: 'Marketplace',
    cards: [
      ['Fluxo de pedidos', 'Acompanhe atividade, economia e historico recente das ofertas.'],
      ['Proximo passo', 'Aqui vamos evoluir publicacao, aprovacao e limites de ofertas.'],
    ],
  },
  produtos: {
    title: 'Produtos e vitrine',
    subtitle: 'Organize itens, tipos e destaques que aparecem no companion.',
    guideTitle: 'Produtos',
    guideTag: 'Catalogo',
    cards: [
      ['Catalogo ativo', 'Use distribuicao por tipo, top itens e curadoria da home para destacar produtos.'],
      ['Proximo passo', 'Entradas locais poderao editar copy, preco e visibilidade por item.'],
    ],
  },
  estoque: {
    title: 'Estoque e inventario',
    subtitle: 'Leia contas com inventario, itens resgatados e volume local do pacote.',
    guideTitle: 'Estoque',
    guideTag: 'Inventario',
    cards: [
      ['Inventario por usuario', 'Veja contas com itens armazenados e limpe volumes quando necessario.'],
      ['Operacao local', 'Este modulo serve como base para um futuro estoque real do marketplace.'],
    ],
  },
  cupons: {
    title: 'Cupons e incentivos',
    subtitle: 'Use esta area para tarefas, bonus e disparos promocionais dentro do produto.',
    guideTitle: 'Cupons',
    guideTag: 'Promocao',
    cards: [
      ['Recompensas', 'As tarefas diarias ja funcionam como base para campanhas e cupons internos.'],
      ['Proximo passo', 'Podemos transformar isso em codigos de bonus e eventos por periodo.'],
    ],
  },
  lootboxes: {
    title: 'Loot boxes e recompensas',
    subtitle: 'Prepare caixas, bonus e sistemas de premio dentro do ecossistema do site.',
    guideTitle: 'Loot Boxes',
    guideTag: 'Recompensas',
    cards: [
      ['Loop de premio', 'Este departamento aproveita tarefas, pontos e economia de recompensas.'],
      ['Proximo passo', 'Podemos cadastrar boxes, pesos de drop e historico de abertura.'],
    ],
  },
  streamers: {
    title: 'Streamers',
    subtitle: 'Curadoria de criadores, campanhas e destaque de parceiros de transmissao.',
    guideTitle: 'Streamers',
    guideTag: 'Creators',
    cards: [
      ['Departamento dedicado', 'Separado para futuras listas de criadores, links e ativações.'],
      ['Proximo passo', 'Podemos adicionar cards com canal, horario e beneficios de parceria.'],
    ],
  },
  parcerias: {
    title: 'Parcerias',
    subtitle: 'Gestao de alianças, afiliados e contatos estrategicos do projeto.',
    guideTitle: 'Parcerias',
    guideTag: 'Negocios',
    cards: [
      ['Base pronta', 'A aba fica isolada para nao misturar operacao com relacionamento.'],
      ['Proximo passo', 'Podemos cadastrar parceiros, status, links e beneficios.'],
    ],
  },
  suporte: {
    title: 'Suporte',
    subtitle: 'Central de tickets, acompanhamento do jogador e triagem operacional local.',
    guideTitle: 'Suporte',
    guideTag: 'Atendimento',
    cards: [
      ['Tickets conectados', 'Chamados abertos no perfil aparecem aqui com prioridade, status e conta vinculada.'],
      ['Triagem rapida', 'Acompanhe fila, avance status e mantenha o historico de atendimento dentro do pacote.'],
    ],
  },
  equipe: {
    title: 'Equipe',
    subtitle: 'Visualize admins, operacao e distribuicao de acesso dentro do pacote.',
    guideTitle: 'Equipe',
    guideTag: 'Acesso',
    cards: [
      ['Controle de acesso', 'Aqui entram admins, auditoria e leitura de quem opera o sistema.'],
      ['Proximo passo', 'Podemos criar papeis mais finos alem de admin e user.'],
    ],
  },
  usuarios: {
    title: 'Usuarios',
    subtitle: 'Gerencie contas locais, saldos, cargos, historico e inventario.',
    guideTitle: 'Usuarios',
    guideTag: 'Contas',
    cards: [
      ['Gestao local', 'Edite conta, senha, saldo, pontos e inventario direto pelo roster.'],
      ['Proximo passo', 'Podemos adicionar bloqueio, tags e filtros de segmento.'],
    ],
  },
};

function loadAuthUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(authUsersStorageKey) || '{}');
    const users = parsed && typeof parsed === 'object' ? parsed : {};
    if (!users[defaultAdminEmail]) {
      users[defaultAdminEmail] = {
        name: 'Admin Local',
        email: defaultAdminEmail,
        password: defaultAdminPassword,
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(authUsersStorageKey, JSON.stringify(users));
    } else if (!users[defaultAdminEmail].role) {
      users[defaultAdminEmail].role = 'admin';
      localStorage.setItem(authUsersStorageKey, JSON.stringify(users));
    }
    return users;
  } catch {
    const users = {
      [defaultAdminEmail]: {
        name: 'Admin Local',
        email: defaultAdminEmail,
        password: defaultAdminPassword,
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
    };
    localStorage.setItem(authUsersStorageKey, JSON.stringify(users));
    return users;
  }
}

function saveAuthUsers() {
  localStorage.setItem(authUsersStorageKey, JSON.stringify(authUsers));
}

function setScopedStorageEntries(baseKey, scope, value) {
  localStorage.setItem(storageKeyForScope(baseKey, scope), JSON.stringify(value));
}

function loadAuthSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(authSessionStorageKey) || '{}');
    return typeof parsed.email === 'string' ? parsed : { email: '' };
  } catch {
    return { email: '' };
  }
}

function saveAuthSession() {
  localStorage.setItem(authSessionStorageKey, JSON.stringify(currentSession));
}

function userStorageScope() {
  return currentSession.email || 'guest';
}

function scopedStorageKey(baseKey) {
  return `${baseKey}.${userStorageScope()}`;
}

function currentUser() {
  return authUsers[currentSession.email] || null;
}

function isAuthenticated() {
  return Boolean(currentUser());
}

function userDisplayName() {
  return currentUser()?.name || 'Visitante';
}

function currentUserRole() {
  return currentUser()?.role || 'guest';
}

function isAdmin() {
  return currentUserRole() === 'admin';
}

function userInitial() {
  return userDisplayName().slice(0, 1).toUpperCase() || 'S';
}

function buildDefaultWallet() {
  return { cashBalance: 125000, pointBalance: 220000 };
}

function reloadUserScopedState() {
  favoriteItemIds = loadFavoriteItemIds();
  dailyTaskState = loadDailyTaskState();
  walletState = loadWalletState();
  purchaseHistory = loadPurchaseHistory();
  inventoryState = loadInventoryState();
  redeemedCouponsState = loadRedeemedCouponsState();
}

function appendAdminAudit(copy, itemName = 'Ajuste admin') {
  if (!isAdmin()) return;
  appendHistoryEntry({
    kind: 'Admin',
    itemName,
    copy,
    date: new Date().toLocaleDateString('pt-BR'),
  });
}

function loadCustomMapMarkers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(markerStorageKey) || '[]');
    return Array.isArray(parsed) ? parsed.filter((marker) => marker?.mapId && marker?.title) : [];
  } catch {
    return [];
  }
}

function saveCustomMapMarkers() {
  localStorage.setItem(markerStorageKey, JSON.stringify(customMapMarkers));
}

function loadHiddenMarkerIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(hiddenMarkerStorageKey) || '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

function saveHiddenMarkerIds() {
  localStorage.setItem(hiddenMarkerStorageKey, JSON.stringify([...hiddenMarkerIds]));
}

function loadCustomMapRoutes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(routeStorageKey) || '[]');
    return Array.isArray(parsed) ? parsed.filter((route) => route?.mapId && route?.title && route?.points?.length >= 2) : [];
  } catch {
    return [];
  }
}

function saveCustomMapRoutes() {
  localStorage.setItem(routeStorageKey, JSON.stringify(customMapRoutes));
}

function loadFavoriteItemIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(scopedStorageKey(itemFavoritesStorageKey)) || '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => findItemById(id)) : []);
  } catch {
    return new Set();
  }
}

function saveFavoriteItemIds() {
  localStorage.setItem(scopedStorageKey(itemFavoritesStorageKey), JSON.stringify([...favoriteItemIds]));
}

function currentDailyKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadDailyTaskState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(scopedStorageKey(dailyTaskStorageKey)) || '{}');
    if (parsed.date !== currentDailyKey() || !parsed.completed) {
      return { date: currentDailyKey(), completed: {} };
    }
    return { date: parsed.date, completed: parsed.completed };
  } catch {
    return { date: currentDailyKey(), completed: {} };
  }
}

function saveDailyTaskState() {
  localStorage.setItem(scopedStorageKey(dailyTaskStorageKey), JSON.stringify(dailyTaskState));
}

function loadWalletState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(scopedStorageKey(walletStorageKey)) || '{}');
    return {
      cashBalance: Number.isFinite(parsed.cashBalance) ? parsed.cashBalance : buildDefaultWallet().cashBalance,
      pointBalance: Number.isFinite(parsed.pointBalance) ? parsed.pointBalance : buildDefaultWallet().pointBalance,
    };
  } catch {
    return buildDefaultWallet();
  }
}

function saveWalletState() {
  localStorage.setItem(scopedStorageKey(walletStorageKey), JSON.stringify(walletState));
}

function loadPurchaseHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(scopedStorageKey(historyStorageKey)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePurchaseHistory() {
  localStorage.setItem(scopedStorageKey(historyStorageKey), JSON.stringify(purchaseHistory));
}

function loadInventoryState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(scopedStorageKey(inventoryStorageKey)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveInventoryState() {
  localStorage.setItem(scopedStorageKey(inventoryStorageKey), JSON.stringify(inventoryState));
}

function loadRedeemedCouponsState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(scopedStorageKey(couponRedeemsStorageKey)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRedeemedCouponsState() {
  localStorage.setItem(scopedStorageKey(couponRedeemsStorageKey), JSON.stringify(redeemedCouponsState));
}

function getUserOrders(email = currentSession.email) {
  if (!email) return [];
  const user = authUsers[email];
  const userName = normalizeText(user?.name || '');
  const userEmail = normalizeText(email);
  return [...adminOperationsConfig.orders]
    .filter((entry) => {
      const ownerEmail = normalizeText(entry.ownerEmail || '');
      const player = normalizeText(entry.player || '');
      return ownerEmail === userEmail || player === userName || player === userEmail;
    })
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
}

function getUserTickets(email = currentSession.email) {
  if (!email) return [];
  const user = authUsers[email];
  const userName = normalizeText(user?.name || '');
  const userEmail = normalizeText(email);
  return [...adminOperationsConfig.tickets]
    .filter((entry) => {
      const ownerEmail = normalizeText(entry.ownerEmail || '');
      const ticketUser = normalizeText(entry.userEmail || '');
      const userNameField = normalizeText(entry.userName || '');
      return ownerEmail === userEmail || ticketUser === userEmail || userNameField === userName || userNameField === userEmail;
    })
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
}

function queueProfileSupportContext({ subject = '', priority = 'media', note = '', itemId = '', orderId = '' } = {}) {
  state.profileSupportContext = {
    subject: String(subject || '').trim(),
    priority: String(priority || 'media').trim(),
    note: String(note || '').trim(),
    itemId: String(itemId || '').trim(),
    orderId: String(orderId || '').trim(),
  };
  if (els.profileSupportSubject) els.profileSupportSubject.value = state.profileSupportContext.subject;
  if (els.profileSupportPriority) els.profileSupportPriority.value = state.profileSupportContext.priority || 'media';
  if (els.profileSupportNote) els.profileSupportNote.value = state.profileSupportContext.note;
  if (els.profileSupportStatus) {
    const labels = [];
    if (state.profileSupportContext.itemId) labels.push(itemNameForId(state.profileSupportContext.itemId));
    if (state.profileSupportContext.orderId) labels.push(`pedido ${state.profileSupportContext.orderId}`);
    els.profileSupportStatus.textContent = labels.length
      ? `Ticket sera vinculado a ${labels.join(' // ')}.`
      : 'Ticket pronto para envio.';
  }
}

function clearProfileSupportContext() {
  state.profileSupportContext = null;
}

function tradeEntryKey(entry) {
  return `${entry.trader}::${entry.itemId}::${entry.cost?.itemId || 'none'}::${entry.cost?.quantity || 0}`;
}

function buildDefaultAdminContentConfig() {
  return {
    dailyTasks: defaultDailyTaskDefinitions.map((task) => ({ ...task })),
    featuredTradeKeys: data.trades.slice(0, 4).map((entry) => tradeEntryKey(entry)),
    featuredItemIds: [...data.items].sort((a, b) => valuePerKgFor(b) - valuePerKgFor(a)).slice(0, 4).map((item) => item.id),
    featuredMapIds: data.maps.filter((map) => map.status === 'ready').slice(0, 4).map((map) => map.id),
  };
}

function loadAdminContentConfig() {
  const fallback = buildDefaultAdminContentConfig();
  try {
    const parsed = JSON.parse(localStorage.getItem(adminContentStorageKey) || '{}');
    return {
      dailyTasks: Array.isArray(parsed.dailyTasks) && parsed.dailyTasks.length
        ? parsed.dailyTasks.map((task, index) => ({
            id: task.id || `task-${index + 1}`,
            title: task.title || `Tarefa ${index + 1}`,
            points: Number(task.points || 0),
            hint: task.hint || 'Sem descricao.',
          }))
        : fallback.dailyTasks,
      featuredTradeKeys: Array.isArray(parsed.featuredTradeKeys) && parsed.featuredTradeKeys.length ? parsed.featuredTradeKeys : fallback.featuredTradeKeys,
      featuredItemIds: Array.isArray(parsed.featuredItemIds) && parsed.featuredItemIds.length ? parsed.featuredItemIds : fallback.featuredItemIds,
      featuredMapIds: Array.isArray(parsed.featuredMapIds) && parsed.featuredMapIds.length ? parsed.featuredMapIds : fallback.featuredMapIds,
    };
  } catch {
    return fallback;
  }
}

function saveAdminContentConfig() {
  localStorage.setItem(adminContentStorageKey, JSON.stringify(adminContentConfig));
}

function createAdminEntryId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;
}

function getBaseTradeValueForItem(item) {
  const trade = data.trades.find((entry) => entry.itemId === item.id);
  if (!trade?.cost?.quantity) return item.value ? Math.round(Number(item.value) * 24) : null;
  return trade.cost.quantity;
}

function buildDefaultAdminOperationsConfig() {
  const featuredItems = [...data.items]
    .sort((a, b) => Number(b.value || 0) - Number(a.value || 0))
    .slice(0, 8);
  const timestamp = new Date().toISOString();
  return {
    orders: featuredItems.slice(0, 4).map((item, index) => ({
      id: createAdminEntryId('order'),
      ownerEmail: index === 0 ? defaultAdminEmail : '',
      player: ['Speranza Prime', 'Raider Norte', 'Equipe Delta', 'Operador Local'][index] || `Jogador ${index + 1}`,
      itemId: item.id,
      channel: index % 2 === 0 ? 'saldo real' : 'pontos',
      status: ['pendente', 'processando', 'entregue', 'pendente'][index] || 'pendente',
      amount: Number(item.value || 0),
      note: 'Entrega local acompanhada pelo admin.',
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    products: featuredItems.map((item, index) => ({
      id: createAdminEntryId('product'),
      itemId: item.id,
      realValue: Number(item.value || 0),
      pointValue: Number(getBaseTradeValueForItem(item) || 0),
      stock: Math.max(2, 8 - index),
      threshold: 2,
      location: ['Hangar A', 'Deposito Norte', 'Grid 7', 'Locker 2'][index % 4],
      visibility: index === 6 ? 'limitado' : 'publicado',
      highlight: index < 3,
      note: index < 3 ? 'Vitrine ativa' : 'Catalogo regular',
    })),
    coupons: [
      { id: createAdminEntryId('coupon'), code: 'WELCOME20', rewardPoints: 200, discountValue: 20, limit: 50, used: 4, status: 'ativo', scope: 'primeira compra' },
      { id: createAdminEntryId('coupon'), code: 'RAIDER100', rewardPoints: 100, discountValue: 0, limit: 120, used: 18, status: 'ativo', scope: 'bonus de pontos' },
      { id: createAdminEntryId('coupon'), code: 'NIGHTDROP', rewardPoints: 0, discountValue: 15, limit: 30, used: 3, status: 'pausado', scope: 'campanha noturna' },
    ],
    lootboxes: [
      { id: createAdminEntryId('lootbox'), name: 'Caixa Tatica', costCash: 2400, costPoints: 5200, rewardSummary: 'Consumiveis, mods e chave rara', rarity: 'raro', status: 'ativa' },
      { id: createAdminEntryId('lootbox'), name: 'Caixa Ouro Velho', costCash: 4200, costPoints: 9800, rewardSummary: 'Lendarios e materiais de topo', rarity: 'lendario', status: 'ativa' },
      { id: createAdminEntryId('lootbox'), name: 'Caixa de Evento', costCash: 0, costPoints: 7600, rewardSummary: 'Drops rotativos sazonais', rarity: 'epico', status: 'pausada' },
    ],
    tickets: [
      { id: createAdminEntryId('ticket'), subject: 'Compra nao caiu no inventario', userName: 'Scout Vega', priority: 'alta', status: 'aberto', channel: 'discord', owner: 'Admin Local', note: 'Validar historico e reprocessar item.' },
      { id: createAdminEntryId('ticket'), subject: 'Duvida sobre pontos diarios', userName: 'Luna ARC', priority: 'media', status: 'em analise', channel: 'site', owner: 'Equipe Ops', note: 'Ajustar FAQ ou responder direto.' },
      { id: createAdminEntryId('ticket'), subject: 'Oferta indisponivel', userName: 'Helio Farm', priority: 'baixa', status: 'resolvido', channel: 'whatsapp', owner: 'Suporte Loot', note: 'Oferta reposta apos revisão.' },
    ],
    team: [
      { id: createAdminEntryId('team'), name: 'Admin Local', role: 'Operacao', shift: 'Noite', status: 'online', contact: 'admin@sucatao.local' },
      { id: createAdminEntryId('team'), name: 'Analista Intel', role: 'Curadoria', shift: 'Tarde', status: 'online', contact: 'intel@sucatao.local' },
      { id: createAdminEntryId('team'), name: 'Suporte Loot', role: 'Atendimento', shift: 'Manha', status: 'standby', contact: 'suporte@sucatao.local' },
    ],
    streamers: [
      { id: createAdminEntryId('streamer'), name: 'ARC Brasil', platform: 'Twitch', status: 'ativo', reach: '12k', code: 'ARCBR', note: 'Lives 3x por semana.' },
      { id: createAdminEntryId('streamer'), name: 'Raiders Hub', platform: 'YouTube', status: 'prospect', reach: '8k', code: 'HUB10', note: 'Canal com guias e highlights.' },
    ],
    partnerships: [
      { id: createAdminEntryId('partner'), name: 'Clube da Semana', category: 'Comunidade', status: 'ativa', benefit: 'Divulgacao cruzada', owner: 'Admin Local' },
      { id: createAdminEntryId('partner'), name: 'Brau Intel', category: 'Conteudo', status: 'negociacao', benefit: 'Spotlight semanal', owner: 'Analista Intel' },
    ],
  };
}

function loadAdminOperationsConfig() {
  const fallback = buildDefaultAdminOperationsConfig();
  const normalizeTickets = (tickets = []) => tickets.map((entry) => ({
    ...entry,
    ownerEmail: String(entry.ownerEmail || entry.userEmail || '').trim().toLowerCase(),
    userEmail: String(entry.userEmail || entry.ownerEmail || '').trim().toLowerCase(),
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || entry.createdAt || new Date().toISOString(),
  }));
  try {
    const parsed = JSON.parse(localStorage.getItem(adminOperationsStorageKey) || '{}');
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : fallback.orders,
      products: Array.isArray(parsed.products) ? parsed.products : fallback.products,
      coupons: Array.isArray(parsed.coupons) ? parsed.coupons : fallback.coupons,
      lootboxes: Array.isArray(parsed.lootboxes) ? parsed.lootboxes : fallback.lootboxes,
      tickets: normalizeTickets(Array.isArray(parsed.tickets) ? parsed.tickets : fallback.tickets),
      team: Array.isArray(parsed.team) ? parsed.team : fallback.team,
      streamers: Array.isArray(parsed.streamers) ? parsed.streamers : fallback.streamers,
      partnerships: Array.isArray(parsed.partnerships) ? parsed.partnerships : fallback.partnerships,
    };
  } catch {
    return fallback;
  }
}

function saveAdminOperationsConfig() {
  localStorage.setItem(adminOperationsStorageKey, JSON.stringify(adminOperationsConfig));
}

function loadAdminUiState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(adminUiStorageKey) || '{}');
    return {
      section: typeof parsed.section === 'string' ? parsed.section : 'dashboard',
      query: typeof parsed.query === 'string' ? parsed.query : '',
      openGroups: Array.isArray(parsed.openGroups) ? parsed.openGroups : ['operacao', 'gestao', 'relacionamento'],
    };
  } catch {
    return {
      section: 'dashboard',
      query: '',
      openGroups: ['operacao', 'gestao', 'relacionamento'],
    };
  }
}

function saveAdminUiState() {
  const openGroups = [...document.querySelectorAll('.admin-nav-group[open]')].map((group) => group.dataset.adminGroup).filter(Boolean);
  localStorage.setItem(
    adminUiStorageKey,
    JSON.stringify({
      section: state.adminSection,
      query: state.adminQuery,
      openGroups,
    }),
  );
}

function getDailyTasks() {
  return adminContentConfig.dailyTasks?.length ? adminContentConfig.dailyTasks : buildDefaultAdminContentConfig().dailyTasks;
}

function getFeaturedTrades() {
  const tradeMap = new Map(data.trades.map((entry) => [tradeEntryKey(entry), entry]));
  const selected = adminContentConfig.featuredTradeKeys.map((key) => tradeMap.get(key)).filter(Boolean);
  return selected.length ? selected : data.trades.slice(0, 4);
}

function getFeaturedItems() {
  const selected = adminContentConfig.featuredItemIds.map((id) => findItemById(id)).filter(Boolean);
  return selected.length ? selected : [...data.items].sort((a, b) => valuePerKgFor(b) - valuePerKgFor(a)).slice(0, 4);
}

function getFeaturedMaps() {
  const mapById = new Map(data.maps.map((map) => [map.id, map]));
  const selected = adminContentConfig.featuredMapIds.map((id) => mapById.get(id)).filter(Boolean);
  return selected.length ? selected : data.maps.filter((map) => map.status === 'ready').slice(0, 4);
}

function ensureCurrentDailyTaskState() {
  const todayKey = currentDailyKey();
  if (dailyTaskState.date !== todayKey) {
    dailyTaskState = { date: todayKey, completed: {} };
    saveDailyTaskState();
  }
}

function loadMapPreferences() {
  try {
    const parsed = JSON.parse(localStorage.getItem(mapPreferencesStorageKey) || '{}');
    const hasMarkerTypes = Array.isArray(parsed.markerTypes);
    const hasRouteTypes = Array.isArray(parsed.routeTypes);
    const markerTypes = hasMarkerTypes
      ? parsed.markerTypes.filter((type) => Object.prototype.hasOwnProperty.call(markerCategories, type))
      : Object.keys(markerCategories);
    const routeTypes = hasRouteTypes
      ? parsed.routeTypes.filter((type) => Object.prototype.hasOwnProperty.call(routeCategories, type))
      : Object.keys(routeCategories);
    return {
      selectedMapId: data.maps.some((map) => map.id === parsed.selectedMapId) ? parsed.selectedMapId : '',
      mapQuery: typeof parsed.mapQuery === 'string' ? parsed.mapQuery : '',
      markerTypes,
      routeTypes,
      showMarkers: typeof parsed.showMarkers === 'boolean' ? parsed.showMarkers : true,
      showRoutes: typeof parsed.showRoutes === 'boolean' ? parsed.showRoutes : true,
      sourceFilter: ['all', 'custom', 'fixed'].includes(parsed.sourceFilter) ? parsed.sourceFilter : 'all',
      mapPreset: typeof parsed.mapPreset === 'string' ? parsed.mapPreset : 'all',
      mapZoom: Number.isFinite(parsed.mapZoom) ? Math.max(1, Math.min(2.5, Math.round(parsed.mapZoom * 10) / 10)) : 1,
    };
  } catch {
    return {};
  }
}

function saveMapPreferences() {
  const payload = {
    selectedMapId: state.selectedMapId,
    mapQuery: state.mapQuery,
    markerTypes: [...state.markerTypes],
    routeTypes: [...state.routeTypes],
    showMarkers: state.showMarkers,
    showRoutes: state.showRoutes,
    sourceFilter: state.sourceFilter,
    mapPreset: state.mapPreset,
    mapZoom: state.mapZoom,
  };
  localStorage.setItem(mapPreferencesStorageKey, JSON.stringify(payload));
}

function getAllMapMarkers() {
  return [...baseMapMarkers, ...customMapMarkers].filter((marker) => !hiddenMarkerIds.has(markerId(marker)));
}

function getAllMapRoutes() {
  return [...baseMapRoutes, ...customMapRoutes];
}

function getFixedMarkersPayload() {
  return [...baseMapMarkers, ...customMapMarkers]
    .filter((marker) => !hiddenMarkerIds.has(markerId(marker)))
    .map((marker, index) => ({
      id: marker.id || `fixed-${index + 1}`,
      mapId: marker.mapId,
      type: marker.type,
      x: marker.x,
      y: marker.y,
      title: marker.title,
      note: marker.note || '',
    }));
}

function getFixedRoutesPayload() {
  return getAllMapRoutes().map((route, index) => ({
    id: route.id || `fixed-route-${index + 1}`,
    mapId: route.mapId,
    type: route.type,
    title: route.title,
    note: route.note || '',
    points: Array.isArray(route.points) ? route.points.map((point) => ({ x: point.x, y: point.y })) : [],
  }));
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function setupMarkerTypeOptions() {
  const options = Object.entries(markerCategories).map(([type, category]) => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = category.label;
    return option;
  });
  els.markerTypeInput.replaceChildren(...options);
}

function setupRouteTypeOptions() {
  const options = Object.entries(routeCategories).map(([type, category]) => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = category.label;
    return option;
  });
  els.routeTypeInput.replaceChildren(...options);
}

function setMapZoom(value) {
  state.mapZoom = Math.max(1, Math.min(2.5, Math.round(value * 10) / 10));
  renderMapsPage();
}

function exportCustomMarkers() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'sucatao-arc-companion-offline',
    version: 1,
    markers: customMapMarkers,
    routes: customMapRoutes,
    hiddenMarkerIds: [...hiddenMarkerIds],
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sucatao-map-intel.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function openImportModal() {
  els.importMarkersInput.value = '';
  els.importStatus.textContent = 'Substitui apenas pings customizados';
  els.importModal.hidden = false;
  document.body.classList.add('modal-open');
  window.setTimeout(() => els.importMarkersInput.focus(), 0);
}

function closeImportModal() {
  els.importModal.hidden = true;
  document.body.classList.remove('modal-open');
}

function importCustomMarkers() {
  let parsed;
  try {
    parsed = JSON.parse(els.importMarkersInput.value.trim());
  } catch {
    els.importStatus.textContent = 'JSON invalido';
    return;
  }

  const importedMarkers = Array.isArray(parsed) ? parsed : Array.isArray(parsed.markers) ? parsed.markers : [];
  const importedRoutes = Array.isArray(parsed.routes) ? parsed.routes : [];
  if (!importedMarkers.length && !importedRoutes.length) {
    els.importStatus.textContent = 'Nenhum ping ou rota encontrado';
    return;
  }

  customMapMarkers = importedMarkers
    .filter((marker) => marker?.mapId && marker?.title)
    .map((marker, index) => ({
      id: marker.id || `custom-imported-${Date.now()}-${index}`,
      mapId: marker.mapId,
      type: markerCategories[marker.type] ? marker.type : Object.keys(markerCategories)[0] || 'route',
      x: clampPercent(Number(marker.x) || 0),
      y: clampPercent(Number(marker.y) || 0),
      title: String(marker.title).slice(0, 48),
      note: String(marker.note || 'Ping importado.').slice(0, 180),
      custom: true,
    }));
  customMapRoutes = importedRoutes
    .filter((route) => route?.mapId && route?.title && Array.isArray(route.points) && route.points.length >= 2)
    .map((route, index) => ({
      id: route.id || `custom-route-imported-${Date.now()}-${index}`,
      mapId: route.mapId,
      type: routeCategories[route.type] ? route.type : Object.keys(routeCategories)[0] || 'farm',
      title: String(route.title).slice(0, 48),
      note: String(route.note || 'Rota importada.').slice(0, 180),
      points: route.points.map((point) => ({ x: clampPercent(Number(point.x) || 0), y: clampPercent(Number(point.y) || 0) })),
      custom: true,
    }));

  if (Array.isArray(parsed.hiddenMarkerIds)) {
    hiddenMarkerIds = new Set(parsed.hiddenMarkerIds.filter(Boolean));
    saveHiddenMarkerIds();
  }

  saveCustomMapMarkers();
  saveCustomMapRoutes();
  state.selectedMarkerId = '';
  state.selectedRouteId = '';
  closeImportModal();
  renderMapsPage();
}

async function saveMarkersToPackage() {
  const markers = getFixedMarkersPayload();
  const routes = getFixedRoutesPayload();
  els.saveMarkersButton.disabled = true;
  els.mapSyncStatus.textContent = 'Salvando pings e rotas no pacote...';

  try {
    const response = await fetch('/api/map-markers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: markerCategories, routeCategories, markers, routes }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Falha ao salvar.');

    localStorage.removeItem(markerStorageKey);
    localStorage.removeItem(hiddenMarkerStorageKey);
    localStorage.removeItem(routeStorageKey);
    els.mapSyncStatus.textContent = `${result.count} pings e ${result.routeCount || 0} rotas gravados. Recarregando...`;
    window.setTimeout(() => window.location.reload(), 700);
  } catch (error) {
    els.mapSyncStatus.textContent = `Nao foi possivel salvar: ${error.message}`;
    els.saveMarkersButton.disabled = false;
  }
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/D';
  return new Intl.NumberFormat('pt-BR').format(Number(value));
}

function getAdminProductRecord(itemId) {
  return adminOperationsConfig.products.find((entry) => entry.itemId === itemId) || null;
}

function cashValueFor(item) {
  const record = getAdminProductRecord(item.id);
  return record ? Number(record.realValue || 0) : Number(item.value || 0);
}

function tradeValueFor(item) {
  const record = getAdminProductRecord(item.id);
  return record ? Number(record.pointValue || 0) : getBaseTradeValueForItem(item);
}

function itemStockFor(item) {
  const record = getAdminProductRecord(item.id);
  return record ? Number(record.stock || 0) : null;
}

function itemThresholdFor(item) {
  const record = getAdminProductRecord(item.id);
  return record ? Number(record.threshold || 0) : 0;
}

function itemVisibilityFor(item) {
  const record = getAdminProductRecord(item.id);
  return record?.visibility || 'publicado';
}

function isItemVisible(item) {
  return itemVisibilityFor(item) !== 'oculto';
}

function isItemInStock(item) {
  const stock = itemStockFor(item);
  return stock === null || stock > 0;
}

function adjustItemStock(itemId, delta) {
  const record = getAdminProductRecord(itemId);
  if (!record) return;
  record.stock = Math.max(0, Number(record.stock || 0) + Number(delta || 0));
  saveAdminOperationsConfig();
}

function getDailyRewardPoints() {
  return getDailyTasks().reduce((total, task) => total + (dailyTaskState.completed[task.id] ? task.points : 0), 0);
}

function getEffectivePointBalance() {
  return Number(walletState.pointBalance || 0) + getDailyRewardPoints();
}

function getRedeemableItemCount() {
  const pointBalance = getEffectivePointBalance();
  return data.items.filter((item) => {
    const pointCost = Number(tradeValueFor(item) || 0);
    return isItemVisible(item) && isItemInStock(item) && pointCost > 0 && pointCost <= pointBalance;
  }).length;
}

function getActiveCoupons() {
  return adminOperationsConfig.coupons.filter((entry) => entry.status === 'ativo');
}

function getActiveLootboxes() {
  return adminOperationsConfig.lootboxes.filter((entry) => entry.status === 'ativa');
}

function getLatestBenefitStatus() {
  const latestBenefit = purchaseHistory.find((entry) => ['Cupom', 'Loot Box'].includes(entry.kind));
  if (!latestBenefit) return '';
  if (latestBenefit.kind === 'Cupom') return `Ultimo beneficio: ${latestBenefit.itemName} aplicado`;
  return `Ultimo drop: ${latestBenefit.itemName}`;
}

function appendHistoryEntry(entry) {
  purchaseHistory = [{ ...entry, timestamp: entry.timestamp || new Date().toISOString() }, ...purchaseHistory].slice(0, 24);
  savePurchaseHistory();
}

function addInventoryItem(item, source) {
  const existing = inventoryState.find((entry) => entry.itemId === item.id && entry.source === source);
  if (existing) {
    existing.quantity += 1;
    existing.updatedAt = new Date().toISOString();
  } else {
    inventoryState = [
      {
        itemId: item.id,
        itemName: item.name,
        source,
        quantity: 1,
        updatedAt: new Date().toISOString(),
      },
      ...inventoryState,
    ].slice(0, 60);
  }
  saveInventoryState();
}

function appendAdminOrderFromAction(item, mode, status = 'entregue', note = '') {
  const user = currentUser();
  if (!user || !item) return;
  adminOperationsConfig.orders.unshift({
    id: createAdminEntryId('order'),
    ownerEmail: user.email,
    player: user.name || user.email,
    itemId: item.id,
    channel: mode === 'cash' ? 'saldo real' : mode === 'points' ? 'pontos' : String(mode || 'manual'),
    status,
    amount: Number(mode === 'cash' ? cashValueFor(item) : tradeValueFor(item) || 0),
    note: note || 'Gerado automaticamente pelo fluxo do usuario.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  adminOperationsConfig.orders = adminOperationsConfig.orders.slice(0, 60);
  saveAdminOperationsConfig();
}

function showToast(message, tone = 'info') {
  window.clearTimeout(toastTimeoutId);
  els.appToast.textContent = message;
  els.appToast.dataset.tone = tone;
  els.appToast.hidden = false;
  toastTimeoutId = window.setTimeout(() => {
    els.appToast.hidden = true;
  }, 2600);
}

function canAffordPoints(item) {
  const pointCost = Number(tradeValueFor(item) || 0);
  return isAuthenticated() && isItemVisible(item) && isItemInStock(item) && pointCost > 0 && pointCost <= getEffectivePointBalance();
}

function canAffordCash(item) {
  const cashCost = Number(cashValueFor(item) || 0);
  return isAuthenticated() && isItemVisible(item) && isItemInStock(item) && cashCost > 0 && cashCost <= Number(walletState.cashBalance || 0);
}

function openAuthModal(mode = 'login') {
  authMode = mode;
  syncAuthModal();
  els.authModal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeAuthModal() {
  els.authModal.hidden = true;
  document.body.classList.remove('modal-open');
  els.authStatusMessage.textContent = 'Os dados ficam salvos apenas no navegador deste pacote offline.';
}

function syncAuthModal() {
  const register = authMode === 'register';
  els.authModalTitle.textContent = register ? 'Criar conta no Sucatao' : 'Entrar no Sucatao';
  els.authModeLoginButton.classList.toggle('active', !register);
  els.authModeRegisterButton.classList.toggle('active', register);
  els.authNameField.hidden = !register;
  els.authNameInput.required = register;
  els.authSubmitButton.textContent = register ? 'Criar conta' : 'Entrar';
}

function createUserAccount(name, email, password) {
  authUsers[email] = {
    name,
    email,
    password,
    role: 'user',
    createdAt: new Date().toISOString(),
  };
  saveAuthUsers();
  currentSession = { email };
  saveAuthSession();
  reloadUserScopedState();
  walletState = loadWalletState();
  saveWalletState();
  appendHistoryEntry({
    kind: 'Conta',
    itemName: 'Conta criada',
    date: new Date().toLocaleString('pt-BR'),
    copy: 'Conta local criada no navegador com carteira inicial disponivel.',
  });
}

function loginUser(email) {
  currentSession = { email };
  saveAuthSession();
  reloadUserScopedState();
  appendHistoryEntry({
    kind: 'Sessao',
    itemName: 'Login local',
    date: new Date().toLocaleString('pt-BR'),
    copy: 'Sessao iniciada com sucesso nesta maquina.',
  });
}

function logoutUser() {
  currentSession = { email: '' };
  saveAuthSession();
  reloadUserScopedState();
  render();
  renderRoute();
}

function renderAuthUI() {
  const loggedIn = isAuthenticated();
  els.authStatusLabel.textContent = loggedIn ? currentUserRole() : 'Offline';
  els.authUserLabel.textContent = userDisplayName();
  els.authActionButton.textContent = loggedIn ? 'Perfil' : 'Entrar';
  els.logoutButton.hidden = !loggedIn;
  els.adminNavLink.hidden = !isAdmin();
}

function renderProfilePage() {
  const loggedIn = isAuthenticated();
  const rewardPoints = getDailyRewardPoints();
  const tasks = getDailyTasks();
  const completedCount = tasks.filter((task) => dailyTaskState.completed[task.id]).length;
  const bonusLabel =
    completedCount === tasks.length ? 'Caixa premium' : completedCount >= 2 ? 'Bonus parcial' : 'Em preparo';

  els.profileStatusLabel.textContent = loggedIn ? `${currentUserRole()} ativo` : 'Visitante';
  els.profileAvatar.textContent = userInitial();
  els.profileName.textContent = userDisplayName();
  els.profileEmail.textContent = currentUser()?.email || 'Entre para salvar progresso por usuario no navegador.';
  els.profileLoginButton.hidden = loggedIn;
  els.profileLogoutButton.hidden = !loggedIn;

  els.profileCashBalance.textContent = formatNumber(walletState.cashBalance);
  els.profilePointBalance.textContent = formatNumber(getEffectivePointBalance());
  els.profileRedeemableCount.textContent = formatNumber(getRedeemableItemCount());
  els.profileDailyResetLabel.textContent = `${dailyTaskState.date} // reset diario`;
  els.profileDailyDoneCount.textContent = `${completedCount}/${tasks.length}`;
  els.profileDailyPointCount.textContent = formatNumber(rewardPoints);
  els.profileDailyBonusLabel.textContent = bonusLabel;
  els.profileFavoriteCount.textContent = formatNumber(favoriteItemIds.size);
  els.profileVisibleItemCount.textContent = formatNumber(data.items.filter((item) => isItemVisible(item)).length);
  els.profileTradeCount.textContent = formatNumber(data.trades.length);
  els.profileReadyMapCount.textContent = formatNumber(data.maps.filter((map) => map.status === 'ready').length);
  els.profileCouponButton.disabled = !loggedIn;
  els.profileCouponInput.disabled = !loggedIn;
  const latestBenefitStatus = getLatestBenefitStatus();
  els.profileCouponStatus.textContent = !loggedIn
    ? 'Entre para aplicar cupons e abrir loot boxes locais.'
    : latestBenefitStatus || `${getActiveCoupons().length} cupons ativos // ${getActiveLootboxes().length} loot boxes ativas`;
  els.profileHistoryCount.textContent = workspaceRecordCountLabel(purchaseHistory.length, 'evento', 'eventos');
  const userOrders = loggedIn ? getUserOrders() : [];
  els.profileOrderCount.textContent = workspaceRecordCountLabel(userOrders.length, 'pedido', 'pedidos');
  els.profilePendingOrderCount.textContent = formatNumber(userOrders.filter((entry) => entry.status === 'pendente').length);
  els.profileProcessingOrderCount.textContent = formatNumber(userOrders.filter((entry) => entry.status === 'processando').length);
  els.profileDeliveredOrderCount.textContent = formatNumber(userOrders.filter((entry) => entry.status === 'entregue').length);
  const userTickets = loggedIn ? getUserTickets() : [];
  els.profileTicketCount.textContent = workspaceRecordCountLabel(userTickets.length, 'ticket', 'tickets');
  els.profileOpenTicketCount.textContent = formatNumber(userTickets.filter((entry) => entry.status === 'aberto').length);
  els.profileReviewTicketCount.textContent = formatNumber(userTickets.filter((entry) => entry.status === 'em analise').length);
  els.profileResolvedTicketCount.textContent = formatNumber(userTickets.filter((entry) => entry.status === 'resolvido').length);
  els.profileSupportForm.hidden = !loggedIn;
  els.profileSupportSubject.disabled = !loggedIn;
  els.profileSupportPriority.disabled = !loggedIn;
  els.profileSupportNote.disabled = !loggedIn;
  els.profileSupportStatus.textContent = !loggedIn
    ? 'Entre para abrir ticket e acompanhar suporte local.'
    : state.profileSupportContext?.orderId || state.profileSupportContext?.itemId
      ? `Ticket sera vinculado a ${[
          state.profileSupportContext.itemId ? itemNameForId(state.profileSupportContext.itemId) : '',
          state.profileSupportContext.orderId ? `pedido ${state.profileSupportContext.orderId}` : '',
        ].filter(Boolean).join(' // ')}.`
    : userTickets.length
      ? `Ultimo ticket: ${userTickets[0].subject}`
      : 'Abra um ticket local para aparecer no admin.';

  const couponCards = getActiveCoupons().map((entry) => {
    const alreadyUsed = redeemedCouponsState.includes(String(entry.code || '').toUpperCase());
    const limitReached = Number(entry.limit || 0) > 0 && Number(entry.used || 0) >= Number(entry.limit || 0);
    const disabled = !loggedIn || alreadyUsed || limitReached;
    const card = document.createElement('article');
    card.className = 'profile-history-card';
    card.innerHTML = `
      <small>${entry.scope || 'cupom local'} // ${entry.status}</small>
      <strong>${entry.code}</strong>
      <p>${formatNumber(entry.rewardPoints || 0)} pontos // ${formatNumber(entry.discountValue || 0)} saldo // ${formatNumber(entry.used || 0)}/${formatNumber(entry.limit || 0)} usos</p>
      <div class="admin-user-row-actions">
        <button type="button" data-coupon-apply="${entry.code}" ${disabled ? 'disabled' : ''}>${alreadyUsed ? 'Ja usado' : limitReached ? 'Esgotado' : 'Aplicar cupom'}</button>
      </div>
    `;
    card.querySelector(`[data-coupon-apply="${entry.code}"]`)?.addEventListener('click', () => applyCouponCode(entry.code));
    return card;
  });
  els.profileCouponList.replaceChildren(
    ...(couponCards.length ? couponCards : [createUtilityEmptyCard('Sem cupons ativos', 'Quando o admin publicar cupons, eles vao aparecer aqui.')]),
  );

  const historyCards = purchaseHistory.map((entry) => {
    const card = document.createElement('article');
    card.className = 'profile-history-card';
    card.innerHTML = `
      <small>${entry.kind} // ${entry.date}</small>
      <strong>${entry.itemName}</strong>
      <p>${entry.copy}</p>
    `;
    return card;
  });
  els.profileHistoryList.replaceChildren(
    ...(historyCards.length ? historyCards : [createUtilityEmptyCard('Sem movimento ainda', 'Compras, resgates e ganhos diarios aparecerao aqui.')]),
  );

  const orderCards = userOrders.map((entry) => {
    const card = document.createElement('article');
    card.className = 'profile-history-card';
    const lastStamp = new Date(entry.updatedAt || entry.createdAt || Date.now()).toLocaleString('pt-BR');
    card.innerHTML = `
      <small>${entry.status} // ${lastStamp}</small>
      <strong>${itemNameForId(entry.itemId)}</strong>
      <p>${formatNumber(entry.amount || 0)} em ${entry.channel}. ${entry.note || 'Pedido local acompanhado pelo admin.'}</p>
      <div class="admin-workspace-badges">
        <span class="${toneClassForStatus(entry.status)}">${entry.status}</span>
        <span>${entry.channel}</span>
      </div>
      <div class="admin-user-row-actions">
        <button type="button" data-profile-order-items="${entry.itemId}">Ver item</button>
        <button type="button" data-profile-order-trades="${entry.itemId}">Ver trades</button>
        <button type="button" data-profile-order-support="${entry.id}">Abrir suporte</button>
      </div>
    `;
    card.querySelector(`[data-profile-order-items="${entry.itemId}"]`)?.addEventListener('click', () => {
      location.hash = '#items';
      state.query = itemNameForId(entry.itemId);
      render();
    });
    card.querySelector(`[data-profile-order-trades="${entry.itemId}"]`)?.addEventListener('click', () => {
      location.hash = '#trades';
      state.tradeQuery = itemNameForId(entry.itemId);
      render();
    });
    card.querySelector(`[data-profile-order-support="${entry.id}"]`)?.addEventListener('click', () => {
      queueProfileSupportContext({
        subject: `Pedido ${itemNameForId(entry.itemId)}`,
        priority: entry.status === 'entregue' ? 'media' : 'alta',
        note: `Preciso de suporte no pedido ${entry.id} referente ao item ${itemNameForId(entry.itemId)}.`,
        itemId: entry.itemId,
        orderId: entry.id,
      });
      renderProfilePage();
      els.profileSupportForm?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      els.profileSupportSubject?.focus();
    });
    return card;
  });
  els.profileOrderList.replaceChildren(
    ...(orderCards.length ? orderCards : [createUtilityEmptyCard('Sem pedidos acompanhados', 'Compras, resgates e caixas com rastreio vao aparecer aqui.')]),
  );

  const ticketCards = userTickets.map((entry) => {
    const card = document.createElement('article');
    card.className = 'profile-history-card';
    const stamp = new Date(entry.updatedAt || entry.createdAt || Date.now()).toLocaleString('pt-BR');
    card.innerHTML = `
      <small>${entry.priority} // ${stamp}</small>
      <strong>${entry.subject}</strong>
      <p>${entry.note || 'Ticket local aberto pelo jogador.'}</p>
      <div class="admin-workspace-badges">
        <span class="${toneClassForStatus(entry.status)}">${entry.status}</span>
        <span>${entry.channel || 'site'}</span>
      </div>
      <div class="admin-user-row-actions">
        ${entry.relatedItemId ? `<button type="button" data-profile-ticket-item="${entry.relatedItemId}">Ver item</button>` : ''}
        ${entry.relatedOrderId ? `<button type="button" data-profile-ticket-order="${entry.relatedOrderId}">Ver pedido</button>` : ''}
      </div>
    `;
    card.querySelector(`[data-profile-ticket-item="${entry.relatedItemId}"]`)?.addEventListener('click', () => {
      location.hash = '#items';
      state.query = itemNameForId(entry.relatedItemId);
      render();
    });
    card.querySelector(`[data-profile-ticket-order="${entry.relatedOrderId}"]`)?.addEventListener('click', () => {
      const order = userOrders.find((orderEntry) => orderEntry.id === entry.relatedOrderId);
      if (!order) return;
      queueProfileSupportContext({
        subject: entry.subject,
        priority: entry.priority,
        note: entry.note || '',
        itemId: order.itemId,
        orderId: order.id,
      });
      renderProfilePage();
      els.profileSupportForm?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return card;
  });
  els.profileTicketList.replaceChildren(
    ...(ticketCards.length ? ticketCards : [createUtilityEmptyCard('Sem tickets abertos', 'Quando voce abrir suporte local, os chamados vao aparecer aqui.')]),
  );

  els.profileInventoryCount.textContent = workspaceRecordCountLabel(
    inventoryState.reduce((total, entry) => total + Number(entry.quantity || 0), 0),
    'item',
    'itens',
  );
  const inventoryCards = inventoryState.map((entry) => {
    const card = document.createElement('article');
    card.className = 'profile-history-card';
    card.innerHTML = `
      <small>${entry.source} // ${new Date(entry.updatedAt).toLocaleString('pt-BR')}</small>
      <strong>${entry.itemName}</strong>
      <p>${formatNumber(entry.quantity)} unidade(s) registradas nesta conta local.</p>
    `;
    return card;
  });
  els.profileInventoryList.replaceChildren(
    ...(inventoryCards.length ? inventoryCards : [createUtilityEmptyCard('Inventario vazio', 'Compras e resgates de itens vao aparecer aqui.')]),
  );

  const lootboxCards = getActiveLootboxes().map((entry) => {
    const affordableCash = Number(entry.costCash || 0) > 0 && Number(entry.costCash || 0) <= Number(walletState.cashBalance || 0);
    const affordablePoints = Number(entry.costPoints || 0) > 0 && Number(entry.costPoints || 0) <= getEffectivePointBalance();
    const card = document.createElement('article');
    card.className = 'profile-history-card';
    card.innerHTML = `
      <small>${entry.rarity} // ${entry.status}</small>
      <strong>${entry.name}</strong>
      <p>${entry.rewardSummary}</p>
      <p>Real ${formatNumber(entry.costCash)} // pontos ${formatNumber(entry.costPoints)}</p>
      <div class="admin-user-row-actions">
        <button type="button" data-lootbox-cash="${entry.id}" ${affordableCash ? '' : 'disabled'}>Abrir com saldo</button>
        <button type="button" data-lootbox-points="${entry.id}" ${affordablePoints ? '' : 'disabled'}>Abrir com pontos</button>
      </div>
    `;
    card.querySelector(`[data-lootbox-cash="${entry.id}"]`)?.addEventListener('click', () => openLootbox(entry.id, 'cash'));
    card.querySelector(`[data-lootbox-points="${entry.id}"]`)?.addEventListener('click', () => openLootbox(entry.id, 'points'));
    return card;
  });
  els.profileLootboxList.replaceChildren(
    ...(lootboxCards.length ? lootboxCards : [createUtilityEmptyCard('Sem loot boxes ativas', 'Quando o admin ativar caixas, elas vao aparecer aqui.')]),
  );
}

function storageKeyForScope(baseKey, scope) {
  return `${baseKey}.${scope}`;
}

function loadScopedEntries(baseKey) {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith(baseKey + '.'))
    .map((key) => {
      try {
        return { scope: key.slice(baseKey.length + 1), value: JSON.parse(localStorage.getItem(key) || 'null') };
      } catch {
        return { scope: key.slice(baseKey.length + 1), value: null };
      }
    });
}

function parseHistoryAmount(entry) {
  if (Number.isFinite(entry.amount)) return Number(entry.amount);
  const match = String(entry.copy || '').match(/([\d.]+)/);
  return match ? Number(String(match[1]).replaceAll('.', '')) : 0;
}

function buildAdminDataset() {
  const users = Object.values(authUsers).map((user) => {
    const scope = user.email;
    const wallet = (() => {
      try {
        return JSON.parse(localStorage.getItem(storageKeyForScope(walletStorageKey, scope)) || 'null') || buildDefaultWallet();
      } catch {
        return buildDefaultWallet();
      }
    })();
    const favorites = (() => {
      try {
        return JSON.parse(localStorage.getItem(storageKeyForScope(itemFavoritesStorageKey, scope)) || '[]');
      } catch {
        return [];
      }
    })();
    const history = (() => {
      try {
        return JSON.parse(localStorage.getItem(storageKeyForScope(historyStorageKey, scope)) || '[]');
      } catch {
        return [];
      }
    })();
    const inventory = (() => {
      try {
        return JSON.parse(localStorage.getItem(storageKeyForScope(inventoryStorageKey, scope)) || '[]');
      } catch {
        return [];
      }
    })();
    return { ...user, wallet, favorites, history, inventory };
  });

  const allHistory = users.flatMap((user) => user.history.map((entry) => ({ ...entry, userName: user.name, role: user.role || 'user' })));
  const allInventory = users.flatMap((user) => user.inventory.map((entry) => ({ ...entry, userName: user.name, role: user.role || 'user' })));
  return { users, allHistory, allInventory };
}

function buildSmoothPath(chartPoints) {
  if (!chartPoints.length) return '';
  if (chartPoints.length === 1) return `M ${chartPoints[0].x} ${chartPoints[0].y}`;

  let path = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
  for (let index = 0; index < chartPoints.length - 1; index += 1) {
    const current = chartPoints[index];
    const next = chartPoints[index + 1];
    const midpointX = (current.x + next.x) / 2;
    path += ` C ${midpointX} ${current.y}, ${midpointX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

function buildTrendMeta(current, previous) {
  if (current === previous) {
    return { tone: 'neutral', label: '0% estavel' };
  }
  if (!previous) {
    return { tone: current > 0 ? 'up' : 'neutral', label: current > 0 ? 'novo fluxo' : '0% estavel' };
  }
  const delta = ((current - previous) / previous) * 100;
  const rounded = `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`;
  return {
    tone: delta > 0 ? 'up' : 'down',
    label: `${rounded} vs mes anterior`,
  };
}

function renderMiniLineChart(values, comparisonValues = [], activeIndex = -1) {
  const safeValues = values.length ? values : Array.from({ length: 12 }, () => 0);
  const safeComparison = comparisonValues.length ? comparisonValues : safeValues;
  const max = Math.max(...safeValues, ...safeComparison, 1);
  const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const points = safeValues.map((value, index) => ({
    x: 4 + index * 8.35,
    y: 92 - (value / max) * 68,
  }));
  const comparisonPoints = safeComparison.map((value, index) => ({
    x: 4 + index * 8.35,
    y: 92 - (value / max) * 68,
  }));
  const linePath = buildSmoothPath(points);
  const comparisonPath = buildSmoothPath(comparisonPoints);
  const areaPath = `${linePath} L ${points[points.length - 1].x} 92 L ${points[0].x} 92 Z`;
  const dots = points
    .map((point, index) => `<circle cx="${point.x}" cy="${point.y}" r="${index === activeIndex ? '2.1' : '1.35'}" class="admin-chart-dot${index === activeIndex ? ' active' : ''}"></circle>`)
    .join('');
  const bars = safeValues
    .map(
      (value, index) => `
        <div class="admin-chart-col${index === activeIndex ? ' active' : ''}">
          <span>${labels[index]}</span>
          <strong>${formatNumber(value)}</strong>
        </div>`,
    )
    .join('');
  return `
    <div class="admin-chart-shell">
      <div class="admin-chart-legend">
        <span><i class="primary"></i>Atual</span>
        <span><i class="secondary"></i>Periodo anterior</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="${areaPath}" class="admin-chart-area"></path>
        <path d="${comparisonPath}" class="admin-chart-line secondary"></path>
        <path d="${linePath}" class="admin-chart-line"></path>
        ${dots}
      </svg>
      <div class="admin-chart-meta">${bars}</div>
    </div>
  `;
}

function renderSparkline(values) {
  const safeValues = values.length ? values : Array.from({ length: 12 }, () => 0);
  const max = Math.max(...safeValues, 1);
  const points = safeValues.map((value, index) => ({
    x: 4 + index * 8.35,
    y: 28 - (value / max) * 20,
  }));
  const path = buildSmoothPath(points);
  return `
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <path d="${path}" class="admin-sparkline-path"></path>
    </svg>
  `;
}

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function renderDonutChart(entries) {
  const safeEntries = entries.filter((entry) => entry.value > 0);
  const total = safeEntries.reduce((sum, entry) => sum + entry.value, 0) || 1;
  let currentAngle = 0;
  const segments = safeEntries
    .map((entry) => {
      const angle = (entry.value / total) * 360;
      const path = describeArc(50, 50, 34, currentAngle, currentAngle + angle);
      currentAngle += angle;
      return `<path d="${path}" stroke="${entry.color}" stroke-width="16" fill="none" stroke-linecap="butt"></path>`;
    })
    .join('');

  const legend = safeEntries
    .map(
      (entry) => `
        <article class="admin-donut-item">
          <div class="admin-donut-label">
            <span class="admin-donut-swatch" style="background:${entry.color}"></span>
            <strong>${entry.label}</strong>
          </div>
          <span>${formatNumber(entry.value)}</span>
        </article>`,
    )
    .join('');

  return {
    chart: `
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="34" class="admin-donut-track"></circle>
        ${segments}
        <circle cx="50" cy="50" r="22" class="admin-donut-hole"></circle>
        <text x="50" y="47" text-anchor="middle" class="admin-donut-total">${formatNumber(total)}</text>
        <text x="50" y="57" text-anchor="middle" class="admin-donut-caption">tipos</text>
      </svg>
    `,
    legend,
  };
}

function adminMatchesQuery(parts) {
  const query = normalizeText(state.adminQuery);
  if (!query) return true;
  return normalizeText(parts.filter(Boolean).join(' ')).includes(query);
}

function updateAdminPanelVisibility() {
  const currentMeta = adminSectionMeta[state.adminSection] || adminSectionMeta.dashboard;
  const savedGroups = new Set(loadAdminUiState().openGroups || []);
  adminNavGroups.forEach((group) => {
    const groupId = group.dataset.adminGroup || '';
    const hasActiveSection = Boolean(group.querySelector(`[data-admin-section="${state.adminSection}"]`));
    group.open = hasActiveSection || savedGroups.has(groupId);
  });
  adminSectionButtons.forEach((button) => {
    const isActive = button.dataset.adminSection === state.adminSection;
    button.classList.toggle('active', isActive);
    if (isActive) {
      button.closest('.admin-nav-group')?.setAttribute('open', '');
    }
  });
  if (els.adminSectionTitle) els.adminSectionTitle.textContent = currentMeta.title;
  if (els.adminSectionSubtitle) els.adminSectionSubtitle.textContent = currentMeta.subtitle;
  if (els.adminSearchInput) els.adminSearchInput.placeholder = getAdminSearchPlaceholder(state.adminSection);
  if (els.adminDepartmentGuideTitle) els.adminDepartmentGuideTitle.textContent = currentMeta.guideTitle;
  if (els.adminDepartmentGuideTag) els.adminDepartmentGuideTag.textContent = currentMeta.guideTag;
  if (els.adminDepartmentCards) {
    const cards = currentMeta.cards.map(([title, copy]) => {
      const card = document.createElement(state.adminSection === 'dashboard' ? 'article' : 'button');
      card.className = 'utility-card';
      if (state.adminSection !== 'dashboard') {
        card.type = 'button';
        card.addEventListener('click', () => {
          state.adminSection = 'dashboard';
          resetAdminWorkspaceEditor();
          renderAdminPage();
        });
      }
      card.innerHTML = `<strong>${title}</strong><p>${copy}</p>`;
      return card;
    });
    els.adminDepartmentCards.replaceChildren(...cards);
  }

  adminPanelNodes.forEach((node) => {
    const groups = String(node.dataset.adminPanel || '')
      .split(/\s+/)
      .filter(Boolean);
    const visible = state.adminSection === 'dashboard' || groups.includes(state.adminSection);
    node.hidden = !visible;
  });
  saveAdminUiState();
}

function updateAdminNavBadges(payload) {
  const entries = {
    dashboard: { count: payload.alerts, tone: payload.alerts ? 'warn' : 'live', label: payload.alerts ? formatNumber(payload.alerts) : 'ok' },
    pedidos: { count: payload.pendingOrders, tone: payload.pendingOrders ? 'warn' : 'live', label: payload.pendingOrders ? formatNumber(payload.pendingOrders) : 'ok' },
    produtos: { count: payload.publishedProducts, tone: payload.publishedProducts ? 'live' : 'off', label: formatNumber(payload.publishedProducts) },
    estoque: { count: payload.lowStockItems, tone: payload.lowStockItems ? 'off' : 'live', label: payload.lowStockItems ? formatNumber(payload.lowStockItems) : 'ok' },
    cupons: { count: payload.activeCoupons, tone: payload.activeCoupons ? 'live' : 'off', label: formatNumber(payload.activeCoupons) },
    lootboxes: { count: payload.activeLootboxes, tone: payload.activeLootboxes ? 'live' : 'off', label: formatNumber(payload.activeLootboxes) },
    usuarios: { count: payload.users, tone: payload.users ? 'live' : 'off', label: formatNumber(payload.users) },
    equipe: { count: payload.teamOnline, tone: payload.teamOnline ? 'live' : 'warn', label: formatNumber(payload.teamOnline) },
    suporte: { count: payload.openTickets, tone: payload.openTickets ? 'warn' : 'live', label: payload.openTickets ? formatNumber(payload.openTickets) : 'ok' },
    streamers: { count: payload.activeStreamers, tone: payload.activeStreamers ? 'live' : 'warn', label: formatNumber(payload.activeStreamers) },
    parcerias: { count: payload.activePartnerships, tone: payload.activePartnerships ? 'live' : 'warn', label: formatNumber(payload.activePartnerships) },
  };

  adminSectionButtons.forEach((button) => {
    const key = button.dataset.adminSection || '';
    const meta = entries[key];
    let badge = button.querySelector('.admin-nav-badge');
    if (!meta) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'admin-nav-badge';
      button.appendChild(badge);
    }
    badge.className = `admin-nav-badge ${meta.tone}`;
    badge.textContent = meta.label;
  });
}

function getAdminSearchPlaceholder(section = state.adminSection) {
  const placeholders = {
    dashboard: 'Usuarios, itens, economia',
    pedidos: 'Jogador, item, canal, status',
    produtos: 'Produto, visibilidade, tipo',
    estoque: 'Item, localizacao, reposicao',
    cupons: 'Codigo, campanha, status',
    lootboxes: 'Box, raridade, status',
    usuarios: 'Nome, email, cargo',
    equipe: 'Nome, funcao, turno',
    suporte: 'Assunto, usuario, prioridade',
    streamers: 'Streamer, plataforma, codigo',
    parcerias: 'Parceria, categoria, responsavel',
  };
  return placeholders[section] || placeholders.dashboard;
}

function fillSelectOptions(select, options, selectedValue) {
  if (!select) return;
  select.innerHTML = options
    .map((option) => `<option value="${option.value}" ${option.value === selectedValue ? 'selected' : ''}>${option.label}</option>`)
    .join('');
}

function syncAdminContentForm() {
  const tasks = getDailyTasks();
  tasks.slice(0, 4).forEach((task, index) => {
    if (adminTaskTitleInputs[index]) adminTaskTitleInputs[index].value = task.title || '';
    if (adminTaskPointsInputs[index]) adminTaskPointsInputs[index].value = Number(task.points || 0);
    if (adminTaskHintInputs[index]) adminTaskHintInputs[index].value = task.hint || '';
  });

  const tradeOptions = data.trades.slice(0, 80).map((entry) => ({
    value: tradeEntryKey(entry),
    label: `${entry.trader} // ${itemNameForId(entry.itemId)}`,
  }));
  const itemOptions = [...data.items]
    .slice(0, 120)
    .map((item) => ({ value: item.id, label: `${item.name} // ${getType(item)}` }));
  const mapOptions = data.maps.map((map) => ({ value: map.id, label: `${map.name} // ${map.label}` }));

  adminFeaturedTradeInputs.forEach((select, index) => fillSelectOptions(select, tradeOptions, adminContentConfig.featuredTradeKeys[index]));
  adminFeaturedItemInputs.forEach((select, index) => fillSelectOptions(select, itemOptions, adminContentConfig.featuredItemIds[index]));
  adminFeaturedMapInputs.forEach((select, index) => fillSelectOptions(select, mapOptions, adminContentConfig.featuredMapIds[index]));
}

function syncAdminUserModal() {
  const isCreate = adminUserModalMode === 'create';
  const user = authUsers[adminEditingUserEmail];
  const wallet = !isCreate && user ? loadWalletStateFor(adminEditingUserEmail) : buildDefaultWallet();
  els.adminUserModalTitle.textContent = isCreate ? 'Criar usuario local' : 'Editar usuario';
  els.adminUserNameInput.value = user?.name || '';
  els.adminUserEmailInput.value = user?.email || '';
  els.adminUserEmailInput.readOnly = !isCreate;
  els.adminUserCashInput.value = Number(wallet.cashBalance || 0);
  els.adminUserPointsInput.value = Number(wallet.pointBalance || 0);
  els.adminUserRoleInput.value = user?.role || 'user';
  els.adminUserRoleInput.disabled = !isCreate && user?.email === defaultAdminEmail;
  els.adminUserPasswordInput.value = isCreate ? '' : user?.password || '';
  els.adminClearHistoryButton.hidden = isCreate;
  els.adminClearInventoryButton.hidden = isCreate;
  els.adminDeleteUserButton.hidden = isCreate;
  els.adminDeleteUserButton.disabled = !isCreate && user?.email === defaultAdminEmail;
  els.adminUserModalStatus.textContent = isCreate
    ? 'Crie uma conta local pronta para testar no pacote offline.'
    : 'Ajustes salvos no navegador deste pacote offline.';
}

function openAdminUserModal(email) {
  adminUserModalMode = 'edit';
  adminEditingUserEmail = email;
  syncAdminUserModal();
  els.adminUserModal.hidden = false;
  document.body.classList.add('modal-open');
}

function openAdminCreateUserModal() {
  adminUserModalMode = 'create';
  adminEditingUserEmail = '';
  syncAdminUserModal();
  els.adminUserModal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeAdminUserModal() {
  adminEditingUserEmail = '';
  adminUserModalMode = 'edit';
  els.adminUserModal.hidden = true;
  document.body.classList.remove('modal-open');
}

function loadWalletStateFor(email) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKeyForScope(walletStorageKey, email)) || 'null');
    return parsed && typeof parsed === 'object'
      ? {
          cashBalance: Number(parsed.cashBalance || buildDefaultWallet().cashBalance),
          pointBalance: Number(parsed.pointBalance || buildDefaultWallet().pointBalance),
        }
      : buildDefaultWallet();
  } catch {
    return buildDefaultWallet();
  }
}

function saveWalletStateFor(email, wallet) {
  setScopedStorageEntries(walletStorageKey, email, {
    cashBalance: Number(wallet.cashBalance || 0),
    pointBalance: Number(wallet.pointBalance || 0),
  });
  if (currentSession.email === email) reloadUserScopedState();
}

function clearUserHistory(email) {
  setScopedStorageEntries(historyStorageKey, email, []);
  if (currentSession.email === email) reloadUserScopedState();
}

function clearUserInventory(email) {
  setScopedStorageEntries(inventoryStorageKey, email, []);
  if (currentSession.email === email) reloadUserScopedState();
}

function loadHistoryStateFor(email) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKeyForScope(historyStorageKey, email)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistoryStateFor(email, history) {
  setScopedStorageEntries(historyStorageKey, email, Array.isArray(history) ? history.slice(0, 24) : []);
  if (currentSession.email === email) reloadUserScopedState();
}

function appendHistoryEntryFor(email, entry) {
  const nextHistory = [
    { ...entry, timestamp: entry.timestamp || new Date().toISOString() },
    ...loadHistoryStateFor(email),
  ].slice(0, 24);
  saveHistoryStateFor(email, nextHistory);
}

function removeUserAccount(email) {
  delete authUsers[email];
  saveAuthUsers();
  [
    itemFavoritesStorageKey,
    dailyTaskStorageKey,
    walletStorageKey,
    historyStorageKey,
    inventoryStorageKey,
  ].forEach((baseKey) => localStorage.removeItem(storageKeyForScope(baseKey, email)));
  if (currentSession.email === email) {
    currentSession = { email: '' };
    saveAuthSession();
    reloadUserScopedState();
  }
}

function isAdminOperationalSection(section = state.adminSection) {
  return ['pedidos', 'produtos', 'estoque', 'cupons', 'lootboxes', 'usuarios', 'suporte', 'equipe', 'streamers', 'parcerias'].includes(section);
}

function createWorkspaceStatCard(label, value, meta = '') {
  const card = document.createElement('article');
  card.className = 'admin-workspace-stat-card';
  card.innerHTML = `<span>${label}</span><strong>${value}</strong>${meta ? `<em>${meta}</em>` : '<em>Local</em>'}`;
  return card;
}

function createWorkspaceRecordCard({ eyebrow, title, copy, badges = [], actions = [] }) {
  const card = document.createElement('article');
  card.className = 'admin-workspace-record';
  card.innerHTML = `
    <div class="admin-workspace-record-head">
      <div>
        <small>${eyebrow}</small>
        <strong>${title}</strong>
      </div>
    </div>
    <p>${copy}</p>
  `;
  if (badges.length) {
    const badgeWrap = document.createElement('div');
    badgeWrap.className = 'admin-workspace-badges';
    badges.forEach((badge) => {
      const chip = document.createElement('span');
      chip.textContent = badge.label;
      if (badge.tone) chip.classList.add(badge.tone);
      badgeWrap.appendChild(chip);
    });
    card.appendChild(badgeWrap);
  }
  if (actions.length) {
    const actionRow = document.createElement('div');
    actionRow.className = 'admin-user-row-actions';
    actions.forEach((action) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = action.label;
      if (action.tone === 'danger') button.classList.add('admin-user-danger');
      if (action.disabled) button.disabled = true;
      button.addEventListener('click', action.onClick);
      actionRow.appendChild(button);
    });
    card.appendChild(actionRow);
  }
  return card;
}

function resetAdminWorkspaceEditor() {
  state.adminEditorId = '';
}

function seedProductRecord(itemId) {
  const item = findItemById(itemId);
  if (!item) return null;
  return {
    id: createAdminEntryId('product'),
    itemId: item.id,
    realValue: Number(item.value || 0),
    pointValue: Number(getBaseTradeValueForItem(item) || 0),
    stock: 5,
    threshold: 2,
    location: 'Deposito local',
    visibility: 'publicado',
    highlight: false,
    note: '',
  };
}

function ensureProductRecord(itemId) {
  let record = getAdminProductRecord(itemId);
  if (record) return record;
  record = seedProductRecord(itemId);
  if (!record) return null;
  adminOperationsConfig.products.unshift(record);
  saveAdminOperationsConfig();
  return record;
}

function workspaceRecordCountLabel(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function toneClassForStatus(status) {
  const value = normalizeText(status);
  if (['ativo', 'ativa', 'publicado', 'online', 'entregue', 'resolvido'].includes(value)) return 'tone-live';
  if (['pendente', 'processando', 'limitado', 'em analise', 'negociacao', 'standby', 'prospect', 'pausado'].includes(value)) return 'tone-warn';
  return 'tone-off';
}

function renderAdminWorkspace() {
  if (!els.adminWorkspaceForm || !els.adminWorkspaceStats || !els.adminWorkspaceList) return;
  if (!isAdminOperationalSection()) {
    els.adminWorkspaceForm.replaceChildren();
    els.adminWorkspaceStats.replaceChildren();
    els.adminWorkspaceList.replaceChildren();
    return;
  }
  switch (state.adminSection) {
    case 'pedidos':
      renderAdminOrdersWorkspace();
      break;
    case 'produtos':
      renderAdminProductsWorkspace();
      break;
    case 'estoque':
      renderAdminStockWorkspace();
      break;
    case 'cupons':
      renderAdminCouponsWorkspace();
      break;
    case 'lootboxes':
      renderAdminLootboxesWorkspace();
      break;
    case 'usuarios':
      renderAdminUsersWorkspace();
      break;
    case 'suporte':
      renderAdminSupportWorkspace();
      break;
    case 'equipe':
      renderAdminTeamWorkspace();
      break;
    case 'streamers':
      renderAdminStreamersWorkspace();
      break;
    case 'parcerias':
      renderAdminPartnershipsWorkspace();
      break;
    default:
      break;
  }
}

function renderAdminWorkspaceShell({ formTitle, formMeta, statsTitle, statsMeta, listTitle, listMeta, stats = [] }) {
  els.adminWorkspaceFormTitle.textContent = formTitle;
  els.adminWorkspaceFormMeta.textContent = formMeta;
  els.adminWorkspaceStatsTitle.textContent = statsTitle;
  els.adminWorkspaceStatsMeta.textContent = statsMeta;
  els.adminWorkspaceListTitle.textContent = listTitle;
  els.adminWorkspaceListMeta.textContent = listMeta;
  els.adminWorkspaceStats.replaceChildren(...stats.map((entry) => createWorkspaceStatCard(entry.label, entry.value, entry.meta)));
}

function setAdminWorkspaceEmpty(title, copy) {
  els.adminWorkspaceList.replaceChildren(createUtilityEmptyCard(title, copy));
}

function buildAdminItemOptions(selectedValue = '') {
  return data.items
    .map((item) => `<option value="${item.id}" ${item.id === selectedValue ? 'selected' : ''}>${item.name}</option>`)
    .join('');
}

function buildAdminUserOptions(selectedValue = '') {
  return [
    '<option value="">Sem vinculo</option>',
    ...Object.values(authUsers)
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'))
      .map((user) => `<option value="${user.email}" ${user.email === selectedValue ? 'selected' : ''}>${user.name} // ${user.email}</option>`),
  ].join('');
}

function renderAdminOrdersWorkspace() {
  const records = [...adminOperationsConfig.orders]
    .filter((entry) => adminMatchesQuery([entry.player, itemNameForId(entry.itemId), entry.channel, entry.status, entry.note]))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const editing = adminOperationsConfig.orders.find((entry) => entry.id === state.adminEditorId) || null;
  const pendingCount = adminOperationsConfig.orders.filter((entry) => entry.status !== 'entregue').length;
  const deliveredCount = adminOperationsConfig.orders.filter((entry) => entry.status === 'entregue').length;
  const totalValue = adminOperationsConfig.orders.reduce((total, entry) => total + Number(entry.amount || 0), 0);
  renderAdminWorkspaceShell({
    formTitle: editing ? 'Editar pedido local' : 'Novo pedido manual',
    formMeta: editing ? 'Atualize status, valor e observacoes.' : 'Crie fila de entrega no pacote offline.',
    statsTitle: 'Fila de pedidos',
    statsMeta: 'Operacao',
    listTitle: 'Pedidos registrados',
    listMeta: workspaceRecordCountLabel(records.length, 'registro', 'registros'),
    stats: [
      { label: 'Pedidos totais', value: formatNumber(adminOperationsConfig.orders.length), meta: 'fila local' },
      { label: 'Pendentes', value: formatNumber(pendingCount), meta: 'aguardando entrega' },
      { label: 'Entregues', value: formatNumber(deliveredCount), meta: 'ciclo fechado' },
      { label: 'Volume', value: formatNumber(totalValue), meta: 'saldo movimentado' },
    ],
  });
  els.adminWorkspaceForm.innerHTML = `
    <div class="admin-workspace-field-grid">
      <label><span>Jogador</span><input name="player" type="text" maxlength="48" value="${editing?.player || ''}" required /></label>
      <label><span>Conta vinculada</span><select name="ownerEmail">${buildAdminUserOptions(editing?.ownerEmail || '')}</select></label>
      <label><span>Item</span><select name="itemId">${buildAdminItemOptions(editing?.itemId || data.items[0]?.id || '')}</select></label>
      <label><span>Canal</span><select name="channel">
        <option value="saldo real" ${editing?.channel === 'saldo real' ? 'selected' : ''}>Saldo real</option>
        <option value="pontos" ${editing?.channel === 'pontos' ? 'selected' : ''}>Pontos</option>
        <option value="manual" ${editing?.channel === 'manual' ? 'selected' : ''}>Manual</option>
      </select></label>
      <label><span>Status</span><select name="status">
        <option value="pendente" ${editing?.status === 'pendente' ? 'selected' : ''}>Pendente</option>
        <option value="processando" ${editing?.status === 'processando' ? 'selected' : ''}>Processando</option>
        <option value="entregue" ${editing?.status === 'entregue' ? 'selected' : ''}>Entregue</option>
        <option value="cancelado" ${editing?.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
      </select></label>
      <label><span>Valor</span><input name="amount" type="number" min="0" step="1" value="${Number(editing?.amount || 0)}" required /></label>
      <label class="admin-field-wide"><span>Observacao</span><textarea name="note">${editing?.note || ''}</textarea></label>
    </div>
    <div class="admin-workspace-actions">
      <small>${editing ? 'Edicao ativa. Salve para atualizar a fila.' : 'Pedidos criados aqui alimentam a operacao local do admin.'}</small>
      <div class="admin-workspace-action-row">
        ${editing ? '<button type="button" data-admin-cancel-edit>Cancelar edicao</button>' : ''}
        <button type="submit">${editing ? 'Salvar pedido' : 'Criar pedido'}</button>
      </div>
    </div>
  `;
  const playerInput = els.adminWorkspaceForm.querySelector('[name="player"]');
  const ownerEmailSelect = els.adminWorkspaceForm.querySelector('[name="ownerEmail"]');
  ownerEmailSelect?.addEventListener('change', (event) => {
    if (editing) return;
    const email = String(event.target.value || '').trim();
    const linkedUser = authUsers[email];
    if (linkedUser && playerInput) playerInput.value = linkedUser.name || linkedUser.email || '';
  });
  els.adminWorkspaceForm.onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(els.adminWorkspaceForm);
    const next = {
      id: editing?.id || createAdminEntryId('order'),
      player: String(form.get('player') || '').trim(),
      ownerEmail: String(form.get('ownerEmail') || '').trim(),
      itemId: String(form.get('itemId') || ''),
      channel: String(form.get('channel') || 'manual'),
      status: String(form.get('status') || 'pendente'),
      amount: Number(form.get('amount') || 0),
      note: String(form.get('note') || '').trim(),
      createdAt: editing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!next.player || !next.itemId) return;
    const collection = [...adminOperationsConfig.orders];
    const index = collection.findIndex((entry) => entry.id === next.id);
    if (index >= 0) collection[index] = next;
    else collection.unshift(next);
    adminOperationsConfig.orders = collection;
    saveAdminOperationsConfig();
    appendAdminAudit(`Pedido de ${next.player} para ${itemNameForId(next.itemId)} salvo no admin.`, 'Pedido');
    showToast(editing ? 'Pedido atualizado.' : 'Pedido criado.', 'success');
    resetAdminWorkspaceEditor();
    renderAdminPage();
  };
  els.adminWorkspaceForm.querySelector('[data-admin-cancel-edit]')?.addEventListener('click', () => {
    resetAdminWorkspaceEditor();
    renderAdminPage();
  });
  const cards = records.map((entry) =>
    createWorkspaceRecordCard({
      eyebrow: `${entry.channel} // ${new Date(entry.updatedAt || entry.createdAt || Date.now()).toLocaleString('pt-BR')}`,
      title: `${entry.player} // ${itemNameForId(entry.itemId)}`,
      copy: `${formatNumber(entry.amount)} em ${entry.channel}.${entry.ownerEmail ? ` Conta ${entry.ownerEmail}.` : ''} ${entry.note || 'Sem observacoes.'}`,
      badges: [
        { label: entry.status, tone: toneClassForStatus(entry.status) },
        { label: `Item ${itemNameForId(entry.itemId)}` },
        ...(entry.ownerEmail ? [{ label: 'Conta vinculada', tone: 'tone-live' }] : []),
      ],
      actions: [
        { label: 'Editar', onClick: () => { state.adminEditorId = entry.id; renderAdminPage(); } },
        { label: 'Avancar status', onClick: () => {
          const flow = ['pendente', 'processando', 'entregue', 'cancelado'];
          const currentIndex = Math.max(0, flow.indexOf(entry.status));
          entry.status = flow[(currentIndex + 1) % flow.length];
          entry.updatedAt = new Date().toISOString();
          saveAdminOperationsConfig();
          appendAdminAudit(`Pedido de ${entry.player} mudou para ${entry.status}.`, 'Pedido');
          renderAdminPage();
        } },
        { label: 'Excluir', tone: 'danger', onClick: () => {
          adminOperationsConfig.orders = adminOperationsConfig.orders.filter((record) => record.id !== entry.id);
          saveAdminOperationsConfig();
          appendAdminAudit(`Pedido de ${entry.player} removido do admin.`, 'Pedido');
          showToast('Pedido removido.', 'success');
          resetAdminWorkspaceEditor();
          renderAdminPage();
        } },
      ],
    }),
  );
  els.adminWorkspaceList.replaceChildren(...(cards.length ? cards : [createUtilityEmptyCard('Sem pedidos locais', 'Crie uma fila manual para acompanhar entregas e ajustes.')] ));
}

function renderAdminProductsWorkspace() {
  const records = [...adminOperationsConfig.products]
    .filter((entry) => adminMatchesQuery([itemNameForId(entry.itemId), entry.visibility, entry.note, entry.location]))
    .sort((a, b) => cashValueFor(findItemById(b.itemId) || { value: b.realValue }) - cashValueFor(findItemById(a.itemId) || { value: a.realValue }));
  const editing = adminOperationsConfig.products.find((entry) => entry.id === state.adminEditorId) || null;
  const publishedCount = adminOperationsConfig.products.filter((entry) => entry.visibility === 'publicado').length;
  const hiddenCount = adminOperationsConfig.products.filter((entry) => entry.visibility === 'oculto').length;
  const featuredCount = adminOperationsConfig.products.filter((entry) => entry.highlight).length;
  renderAdminWorkspaceShell({
    formTitle: editing ? 'Editar vitrine do item' : 'Publicar ou ajustar item',
    formMeta: 'Valores e visibilidade refletem no catalogo principal.',
    statsTitle: 'Produtos administrados',
    statsMeta: 'Marketplace',
    listTitle: 'Itens sob controle',
    listMeta: workspaceRecordCountLabel(records.length, 'produto', 'produtos'),
    stats: [
      { label: 'Produtos', value: formatNumber(adminOperationsConfig.products.length), meta: 'com override' },
      { label: 'Publicados', value: formatNumber(publishedCount), meta: 'visiveis no site' },
      { label: 'Destaques', value: formatNumber(featuredCount), meta: 'vitrine premium' },
      { label: 'Ocultos', value: formatNumber(hiddenCount), meta: 'fora do catalogo' },
    ],
  });
  els.adminWorkspaceForm.innerHTML = `
    <div class="admin-workspace-field-grid">
      <label><span>Item</span><select name="itemId">${buildAdminItemOptions(editing?.itemId || data.items[0]?.id || '')}</select></label>
      <label><span>Visibilidade</span><select name="visibility">
        <option value="publicado" ${editing?.visibility === 'publicado' ? 'selected' : ''}>Publicado</option>
        <option value="limitado" ${editing?.visibility === 'limitado' ? 'selected' : ''}>Limitado</option>
        <option value="oculto" ${editing?.visibility === 'oculto' ? 'selected' : ''}>Oculto</option>
      </select></label>
      <label><span>Valor real</span><input name="realValue" type="number" min="0" step="1" value="${Number(editing?.realValue || 0)}" required /></label>
      <label><span>Pontos</span><input name="pointValue" type="number" min="0" step="1" value="${Number(editing?.pointValue || 0)}" required /></label>
      <label><span>Estoque</span><input name="stock" type="number" min="0" step="1" value="${Number(editing?.stock ?? 5)}" required /></label>
      <label><span>Destaque</span><select name="highlight">
        <option value="0" ${editing?.highlight ? '' : 'selected'}>Normal</option>
        <option value="1" ${editing?.highlight ? 'selected' : ''}>Em destaque</option>
      </select></label>
      <label class="admin-field-wide"><span>Observacao</span><textarea name="note">${editing?.note || ''}</textarea></label>
    </div>
    <div class="admin-workspace-actions">
      <small>Esta area governa preco real, pontos, estoque e visibilidade do item no site.</small>
      <div class="admin-workspace-action-row">
        ${editing ? '<button type="button" data-admin-cancel-edit>Cancelar edicao</button>' : ''}
        <button type="submit">${editing ? 'Salvar produto' : 'Publicar item'}</button>
      </div>
    </div>
  `;
  els.adminWorkspaceForm.onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(els.adminWorkspaceForm);
    const itemId = String(form.get('itemId') || '');
    const base = editing || ensureProductRecord(itemId) || seedProductRecord(itemId);
    if (!base) return;
    const next = {
      ...base,
      itemId,
      realValue: Number(form.get('realValue') || 0),
      pointValue: Number(form.get('pointValue') || 0),
      stock: Number(form.get('stock') || 0),
      threshold: Number(base.threshold || 2),
      location: base.location || 'Deposito local',
      visibility: String(form.get('visibility') || 'publicado'),
      highlight: String(form.get('highlight') || '0') === '1',
      note: String(form.get('note') || '').trim(),
    };
    const collection = [...adminOperationsConfig.products];
    const index = collection.findIndex((entry) => entry.id === next.id || entry.itemId === itemId);
    if (index >= 0) collection[index] = next;
    else collection.unshift(next);
    adminOperationsConfig.products = collection;
    saveAdminOperationsConfig();
    appendAdminAudit(`Produto ${itemNameForId(itemId)} atualizado no marketplace local.`, 'Produto');
    showToast(editing ? 'Produto atualizado.' : 'Produto publicado.', 'success');
    resetAdminWorkspaceEditor();
    render();
  };
  els.adminWorkspaceForm.querySelector('[data-admin-cancel-edit]')?.addEventListener('click', () => {
    resetAdminWorkspaceEditor();
    renderAdminPage();
  });
  const cards = records.map((entry) =>
    createWorkspaceRecordCard({
      eyebrow: `${entry.visibility} // estoque ${formatNumber(entry.stock)}`,
      title: itemNameForId(entry.itemId),
      copy: `Real ${formatNumber(entry.realValue)} // pontos ${formatNumber(entry.pointValue)}. ${entry.note || 'Sem observacoes.'}`,
      badges: [
        { label: entry.visibility, tone: toneClassForStatus(entry.visibility) },
        { label: entry.highlight ? 'Destaque' : 'Catalogo' },
        { label: entry.stock <= Number(entry.threshold || 0) ? 'Reposicao' : 'Estavel', tone: entry.stock <= Number(entry.threshold || 0) ? 'tone-warn' : 'tone-live' },
      ],
      actions: [
        { label: 'Editar', onClick: () => { state.adminEditorId = entry.id; renderAdminPage(); } },
        { label: entry.visibility === 'oculto' ? 'Publicar' : 'Ocultar', onClick: () => {
          entry.visibility = entry.visibility === 'oculto' ? 'publicado' : 'oculto';
          saveAdminOperationsConfig();
          appendAdminAudit(`Visibilidade de ${itemNameForId(entry.itemId)} alterada para ${entry.visibility}.`, 'Produto');
          render();
        } },
        { label: 'Remover override', tone: 'danger', onClick: () => {
          adminOperationsConfig.products = adminOperationsConfig.products.filter((record) => record.id !== entry.id);
          saveAdminOperationsConfig();
          appendAdminAudit(`Override de ${itemNameForId(entry.itemId)} removido.`, 'Produto');
          showToast('Override removido.', 'success');
          resetAdminWorkspaceEditor();
          render();
        } },
      ],
    }),
  );
  els.adminWorkspaceList.replaceChildren(...(cards.length ? cards : [createUtilityEmptyCard('Sem produtos configurados', 'Publique itens para controlar valores e vitrine local.')] ));
}

function renderAdminStockWorkspace() {
  const records = [...adminOperationsConfig.products]
    .filter((entry) => adminMatchesQuery([itemNameForId(entry.itemId), entry.location, entry.note, entry.visibility]))
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
  const editing = adminOperationsConfig.products.find((entry) => entry.id === state.adminEditorId) || null;
  const lowStockCount = adminOperationsConfig.products.filter((entry) => Number(entry.stock || 0) <= Number(entry.threshold || 0)).length;
  const zeroStockCount = adminOperationsConfig.products.filter((entry) => Number(entry.stock || 0) === 0).length;
  const stockUnits = adminOperationsConfig.products.reduce((total, entry) => total + Number(entry.stock || 0), 0);
  renderAdminWorkspaceShell({
    formTitle: editing ? 'Ajustar reposicao' : 'Registrar estoque',
    formMeta: 'Controle fino de quantidade, alerta e localizacao.',
    statsTitle: 'Saude do estoque',
    statsMeta: 'Warehouse',
    listTitle: 'Itens monitorados',
    listMeta: workspaceRecordCountLabel(records.length, 'item', 'itens'),
    stats: [
      { label: 'Unidades', value: formatNumber(stockUnits), meta: 'estoque total' },
      { label: 'Alertas', value: formatNumber(lowStockCount), meta: 'abaixo do limite' },
      { label: 'Esgotados', value: formatNumber(zeroStockCount), meta: 'sem unidades' },
      { label: 'Locais', value: formatNumber(new Set(adminOperationsConfig.products.map((entry) => entry.location).filter(Boolean)).size), meta: 'enderecos ativos' },
    ],
  });
  els.adminWorkspaceForm.innerHTML = `
    <div class="admin-workspace-field-grid">
      <label><span>Item</span><select name="itemId">${buildAdminItemOptions(editing?.itemId || data.items[0]?.id || '')}</select></label>
      <label><span>Estoque atual</span><input name="stock" type="number" min="0" step="1" value="${Number(editing?.stock ?? 0)}" required /></label>
      <label><span>Limite de alerta</span><input name="threshold" type="number" min="0" step="1" value="${Number(editing?.threshold ?? 2)}" required /></label>
      <label><span>Localizacao</span><input name="location" type="text" maxlength="40" value="${editing?.location || 'Deposito local'}" required /></label>
      <label class="admin-field-wide"><span>Observacao</span><textarea name="note">${editing?.note || ''}</textarea></label>
    </div>
    <div class="admin-workspace-actions">
      <small>O estoque alimenta disponibilidade dos itens no catalogo principal.</small>
      <div class="admin-workspace-action-row">
        ${editing ? '<button type="button" data-admin-cancel-edit>Cancelar edicao</button>' : ''}
        <button type="submit">${editing ? 'Salvar estoque' : 'Criar controle'}</button>
      </div>
    </div>
  `;
  els.adminWorkspaceForm.onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(els.adminWorkspaceForm);
    const itemId = String(form.get('itemId') || '');
    const base = editing || ensureProductRecord(itemId) || seedProductRecord(itemId);
    if (!base) return;
    const next = {
      ...base,
      itemId,
      stock: Number(form.get('stock') || 0),
      threshold: Number(form.get('threshold') || 0),
      location: String(form.get('location') || '').trim(),
      note: String(form.get('note') || '').trim(),
    };
    const collection = [...adminOperationsConfig.products];
    const index = collection.findIndex((entry) => entry.id === next.id || entry.itemId === itemId);
    if (index >= 0) collection[index] = next;
    else collection.unshift(next);
    adminOperationsConfig.products = collection;
    saveAdminOperationsConfig();
    appendAdminAudit(`Estoque de ${itemNameForId(itemId)} ajustado para ${next.stock}.`, 'Estoque');
    showToast('Estoque atualizado.', 'success');
    resetAdminWorkspaceEditor();
    render();
  };
  els.adminWorkspaceForm.querySelector('[data-admin-cancel-edit]')?.addEventListener('click', () => {
    resetAdminWorkspaceEditor();
    renderAdminPage();
  });
  const cards = records.map((entry) =>
    createWorkspaceRecordCard({
      eyebrow: `${entry.location || 'Deposito local'} // limite ${formatNumber(entry.threshold || 0)}`,
      title: itemNameForId(entry.itemId),
      copy: `${formatNumber(entry.stock)} unidades. ${entry.note || 'Sem observacoes de reposicao.'}`,
      badges: [
        { label: `Estoque ${formatNumber(entry.stock)}` },
        { label: entry.stock <= Number(entry.threshold || 0) ? 'Reposicao urgente' : 'Saudavel', tone: entry.stock <= Number(entry.threshold || 0) ? 'tone-warn' : 'tone-live' },
      ],
      actions: [
        { label: '+1', onClick: () => { adjustItemStock(entry.itemId, 1); appendAdminAudit(`Estoque de ${itemNameForId(entry.itemId)} recebeu +1 unidade.`, 'Estoque'); render(); } },
        { label: '-1', onClick: () => { adjustItemStock(entry.itemId, -1); appendAdminAudit(`Estoque de ${itemNameForId(entry.itemId)} perdeu 1 unidade.`, 'Estoque'); render(); } },
        { label: 'Editar', onClick: () => { state.adminEditorId = entry.id; renderAdminPage(); } },
      ],
    }),
  );
  els.adminWorkspaceList.replaceChildren(...(cards.length ? cards : [createUtilityEmptyCard('Sem estoque monitorado', 'Crie pelo menos um controle para o inventario operacional.')] ));
}

function renderAdminCouponsWorkspace() {
  const records = [...adminOperationsConfig.coupons]
    .filter((entry) => adminMatchesQuery([entry.code, entry.scope, entry.status]))
    .sort((a, b) => String(a.code).localeCompare(String(b.code), 'pt-BR'));
  const editing = adminOperationsConfig.coupons.find((entry) => entry.id === state.adminEditorId) || null;
  const activeCount = adminOperationsConfig.coupons.filter((entry) => entry.status === 'ativo').length;
  const totalUses = adminOperationsConfig.coupons.reduce((total, entry) => total + Number(entry.used || 0), 0);
  renderAdminWorkspaceShell({
    formTitle: editing ? 'Editar cupom local' : 'Criar cupom',
    formMeta: 'Ative campanhas de pontos ou desconto sem backend.',
    statsTitle: 'Campanhas',
    statsMeta: 'Cupons',
    listTitle: 'Cupons registrados',
    listMeta: workspaceRecordCountLabel(records.length, 'cupom', 'cupons'),
    stats: [
      { label: 'Cupons', value: formatNumber(adminOperationsConfig.coupons.length), meta: 'base ativa' },
      { label: 'Ativos', value: formatNumber(activeCount), meta: 'publicados' },
      { label: 'Usos', value: formatNumber(totalUses), meta: 'consumo local' },
      { label: 'Capacidade', value: formatNumber(adminOperationsConfig.coupons.reduce((total, entry) => total + Number(entry.limit || 0), 0)), meta: 'limites somados' },
    ],
  });
  els.adminWorkspaceForm.innerHTML = `
    <div class="admin-workspace-field-grid">
      <label><span>Codigo</span><input name="code" type="text" maxlength="24" value="${editing?.code || ''}" required /></label>
      <label><span>Status</span><select name="status">
        <option value="ativo" ${editing?.status === 'ativo' ? 'selected' : ''}>Ativo</option>
        <option value="pausado" ${editing?.status === 'pausado' ? 'selected' : ''}>Pausado</option>
        <option value="encerrado" ${editing?.status === 'encerrado' ? 'selected' : ''}>Encerrado</option>
      </select></label>
      <label><span>Desconto</span><input name="discountValue" type="number" min="0" step="1" value="${Number(editing?.discountValue || 0)}" /></label>
      <label><span>Bonus de pontos</span><input name="rewardPoints" type="number" min="0" step="1" value="${Number(editing?.rewardPoints || 0)}" /></label>
      <label><span>Limite</span><input name="limit" type="number" min="0" step="1" value="${Number(editing?.limit || 0)}" /></label>
      <label><span>Usos atuais</span><input name="used" type="number" min="0" step="1" value="${Number(editing?.used || 0)}" /></label>
      <label class="admin-field-wide"><span>Escopo</span><input name="scope" type="text" maxlength="48" value="${editing?.scope || ''}" /></label>
    </div>
    <div class="admin-workspace-actions">
      <small>Use cupons para campanhas, onboarding e recompensas internas.</small>
      <div class="admin-workspace-action-row">
        ${editing ? '<button type="button" data-admin-cancel-edit>Cancelar edicao</button>' : ''}
        <button type="submit">${editing ? 'Salvar cupom' : 'Criar cupom'}</button>
      </div>
    </div>
  `;
  els.adminWorkspaceForm.onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(els.adminWorkspaceForm);
    const next = {
      id: editing?.id || createAdminEntryId('coupon'),
      code: String(form.get('code') || '').trim().toUpperCase(),
      status: String(form.get('status') || 'ativo'),
      discountValue: Number(form.get('discountValue') || 0),
      rewardPoints: Number(form.get('rewardPoints') || 0),
      limit: Number(form.get('limit') || 0),
      used: Number(form.get('used') || 0),
      scope: String(form.get('scope') || '').trim(),
    };
    const collection = [...adminOperationsConfig.coupons];
    const index = collection.findIndex((entry) => entry.id === next.id);
    if (index >= 0) collection[index] = next;
    else collection.unshift(next);
    adminOperationsConfig.coupons = collection;
    saveAdminOperationsConfig();
    appendAdminAudit(`Cupom ${next.code} salvo no admin local.`, 'Cupom');
    showToast(editing ? 'Cupom atualizado.' : 'Cupom criado.', 'success');
    resetAdminWorkspaceEditor();
    renderAdminPage();
  };
  els.adminWorkspaceForm.querySelector('[data-admin-cancel-edit]')?.addEventListener('click', () => {
    resetAdminWorkspaceEditor();
    renderAdminPage();
  });
  const cards = records.map((entry) =>
    createWorkspaceRecordCard({
      eyebrow: `${entry.scope || 'escopo livre'} // limite ${formatNumber(entry.limit)}`,
      title: entry.code,
      copy: `${formatNumber(entry.rewardPoints)} pontos // ${formatNumber(entry.discountValue)} de desconto // ${formatNumber(entry.used)} usos.`,
      badges: [
        { label: entry.status, tone: toneClassForStatus(entry.status) },
        { label: entry.discountValue ? `${formatNumber(entry.discountValue)} off` : 'Sem desconto' },
        { label: entry.rewardPoints ? `${formatNumber(entry.rewardPoints)} pts` : 'Sem bonus' },
      ],
      actions: [
        { label: 'Editar', onClick: () => { state.adminEditorId = entry.id; renderAdminPage(); } },
        { label: entry.status === 'ativo' ? 'Pausar' : 'Ativar', onClick: () => {
          entry.status = entry.status === 'ativo' ? 'pausado' : 'ativo';
          saveAdminOperationsConfig();
          appendAdminAudit(`Cupom ${entry.code} mudou para ${entry.status}.`, 'Cupom');
          renderAdminPage();
        } },
        { label: 'Excluir', tone: 'danger', onClick: () => {
          adminOperationsConfig.coupons = adminOperationsConfig.coupons.filter((record) => record.id !== entry.id);
          saveAdminOperationsConfig();
          appendAdminAudit(`Cupom ${entry.code} removido.`, 'Cupom');
          showToast('Cupom removido.', 'success');
          resetAdminWorkspaceEditor();
          renderAdminPage();
        } },
      ],
    }),
  );
  els.adminWorkspaceList.replaceChildren(...(cards.length ? cards : [createUtilityEmptyCard('Sem cupons', 'Crie um cupom para iniciar campanhas locais.')] ));
}

function renderAdminLootboxesWorkspace() {
  const records = [...adminOperationsConfig.lootboxes]
    .filter((entry) => adminMatchesQuery([entry.name, entry.rewardSummary, entry.status, entry.rarity]))
    .sort((a, b) => Number(b.costPoints || 0) - Number(a.costPoints || 0));
  const editing = adminOperationsConfig.lootboxes.find((entry) => entry.id === state.adminEditorId) || null;
  renderAdminWorkspaceShell({
    formTitle: editing ? 'Editar loot box' : 'Criar loot box',
    formMeta: 'Monte pacotes promocionais e caixas sazonais.',
    statsTitle: 'Pacotes',
    statsMeta: 'Loot boxes',
    listTitle: 'Boxes registradas',
    listMeta: workspaceRecordCountLabel(records.length, 'box', 'boxes'),
    stats: [
      { label: 'Boxes', value: formatNumber(adminOperationsConfig.lootboxes.length), meta: 'catalogo local' },
      { label: 'Ativas', value: formatNumber(adminOperationsConfig.lootboxes.filter((entry) => entry.status === 'ativa').length), meta: 'vendaveis' },
      { label: 'Pontos', value: formatNumber(adminOperationsConfig.lootboxes.reduce((total, entry) => total + Number(entry.costPoints || 0), 0)), meta: 'soma de custo' },
      { label: 'Saldo real', value: formatNumber(adminOperationsConfig.lootboxes.reduce((total, entry) => total + Number(entry.costCash || 0), 0)), meta: 'preco agregado' },
    ],
  });
  els.adminWorkspaceForm.innerHTML = `
    <div class="admin-workspace-field-grid">
      <label><span>Nome</span><input name="name" type="text" maxlength="48" value="${editing?.name || ''}" required /></label>
      <label><span>Status</span><select name="status">
        <option value="ativa" ${editing?.status === 'ativa' ? 'selected' : ''}>Ativa</option>
        <option value="pausada" ${editing?.status === 'pausada' ? 'selected' : ''}>Pausada</option>
        <option value="encerrada" ${editing?.status === 'encerrada' ? 'selected' : ''}>Encerrada</option>
      </select></label>
      <label><span>Custo real</span><input name="costCash" type="number" min="0" step="1" value="${Number(editing?.costCash || 0)}" /></label>
      <label><span>Custo em pontos</span><input name="costPoints" type="number" min="0" step="1" value="${Number(editing?.costPoints || 0)}" /></label>
      <label><span>Raridade</span><select name="rarity">
        <option value="comum" ${editing?.rarity === 'comum' ? 'selected' : ''}>Comum</option>
        <option value="raro" ${editing?.rarity === 'raro' ? 'selected' : ''}>Raro</option>
        <option value="epico" ${editing?.rarity === 'epico' ? 'selected' : ''}>Epico</option>
        <option value="lendario" ${editing?.rarity === 'lendario' ? 'selected' : ''}>Lendario</option>
      </select></label>
      <label class="admin-field-wide"><span>Recompensas</span><textarea name="rewardSummary">${editing?.rewardSummary || ''}</textarea></label>
    </div>
    <div class="admin-workspace-actions">
      <small>Caixas ativas podem virar campanhas premium ou recompensas sazonais.</small>
      <div class="admin-workspace-action-row">
        ${editing ? '<button type="button" data-admin-cancel-edit>Cancelar edicao</button>' : ''}
        <button type="submit">${editing ? 'Salvar box' : 'Criar box'}</button>
      </div>
    </div>
  `;
  els.adminWorkspaceForm.onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(els.adminWorkspaceForm);
    const next = {
      id: editing?.id || createAdminEntryId('lootbox'),
      name: String(form.get('name') || '').trim(),
      status: String(form.get('status') || 'ativa'),
      costCash: Number(form.get('costCash') || 0),
      costPoints: Number(form.get('costPoints') || 0),
      rarity: String(form.get('rarity') || 'raro'),
      rewardSummary: String(form.get('rewardSummary') || '').trim(),
    };
    const collection = [...adminOperationsConfig.lootboxes];
    const index = collection.findIndex((entry) => entry.id === next.id);
    if (index >= 0) collection[index] = next;
    else collection.unshift(next);
    adminOperationsConfig.lootboxes = collection;
    saveAdminOperationsConfig();
    appendAdminAudit(`Loot box ${next.name} salva no admin local.`, 'Loot box');
    showToast(editing ? 'Loot box atualizada.' : 'Loot box criada.', 'success');
    resetAdminWorkspaceEditor();
    renderAdminPage();
  };
  els.adminWorkspaceForm.querySelector('[data-admin-cancel-edit]')?.addEventListener('click', () => {
    resetAdminWorkspaceEditor();
    renderAdminPage();
  });
  const cards = records.map((entry) =>
    createWorkspaceRecordCard({
      eyebrow: `${entry.rarity} // ${entry.status}`,
      title: entry.name,
      copy: `${formatNumber(entry.costCash)} real // ${formatNumber(entry.costPoints)} pontos. ${entry.rewardSummary}`,
      badges: [
        { label: entry.status, tone: toneClassForStatus(entry.status) },
        { label: entry.rarity },
      ],
      actions: [
        { label: 'Editar', onClick: () => { state.adminEditorId = entry.id; renderAdminPage(); } },
        { label: entry.status === 'ativa' ? 'Pausar' : 'Ativar', onClick: () => {
          entry.status = entry.status === 'ativa' ? 'pausada' : 'ativa';
          saveAdminOperationsConfig();
          appendAdminAudit(`Loot box ${entry.name} mudou para ${entry.status}.`, 'Loot box');
          renderAdminPage();
        } },
        { label: 'Excluir', tone: 'danger', onClick: () => {
          adminOperationsConfig.lootboxes = adminOperationsConfig.lootboxes.filter((record) => record.id !== entry.id);
          saveAdminOperationsConfig();
          appendAdminAudit(`Loot box ${entry.name} removida.`, 'Loot box');
          showToast('Loot box removida.', 'success');
          resetAdminWorkspaceEditor();
          renderAdminPage();
        } },
      ],
    }),
  );
  els.adminWorkspaceList.replaceChildren(...(cards.length ? cards : [createUtilityEmptyCard('Sem loot boxes', 'Crie uma box para campanhas e eventos locais.')] ));
}

function renderAdminSupportWorkspace() {
  const records = [...adminOperationsConfig.tickets]
    .filter((entry) => adminMatchesQuery([entry.subject, entry.userName, entry.userEmail, entry.ownerEmail, entry.priority, entry.status, entry.channel, entry.owner]))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  const editing = adminOperationsConfig.tickets.find((entry) => entry.id === state.adminEditorId) || null;
  renderAdminWorkspaceShell({
    formTitle: editing ? 'Editar ticket' : 'Abrir ticket interno',
    formMeta: 'Centralize atendimento e follow-up sem sair do pacote.',
    statsTitle: 'Suporte',
    statsMeta: 'Atendimento',
    listTitle: 'Fila de tickets',
    listMeta: workspaceRecordCountLabel(records.length, 'ticket', 'tickets'),
    stats: [
      { label: 'Tickets', value: formatNumber(adminOperationsConfig.tickets.length), meta: 'fila total' },
      { label: 'Abertos', value: formatNumber(adminOperationsConfig.tickets.filter((entry) => entry.status === 'aberto').length), meta: 'novo atendimento' },
      { label: 'Em analise', value: formatNumber(adminOperationsConfig.tickets.filter((entry) => entry.status === 'em analise').length), meta: 'follow-up' },
      { label: 'Resolvidos', value: formatNumber(adminOperationsConfig.tickets.filter((entry) => entry.status === 'resolvido').length), meta: 'fechados' },
    ],
  });
  els.adminWorkspaceForm.innerHTML = `
    <div class="admin-workspace-field-grid">
      <label><span>Assunto</span><input name="subject" type="text" maxlength="60" value="${editing?.subject || ''}" required /></label>
      <label><span>Usuario</span><input name="userName" type="text" maxlength="48" value="${editing?.userName || ''}" required /></label>
      <label><span>Conta vinculada</span><select name="ownerEmail">${buildAdminUserOptions(editing?.ownerEmail || editing?.userEmail || '')}</select></label>
      <label><span>Item vinculado</span><select name="relatedItemId"><option value="">Sem item</option>${buildAdminItemOptions(editing?.relatedItemId || '')}</select></label>
      <label><span>Prioridade</span><select name="priority">
        <option value="baixa" ${editing?.priority === 'baixa' ? 'selected' : ''}>Baixa</option>
        <option value="media" ${editing?.priority === 'media' ? 'selected' : ''}>Media</option>
        <option value="alta" ${editing?.priority === 'alta' ? 'selected' : ''}>Alta</option>
      </select></label>
      <label><span>Status</span><select name="status">
        <option value="aberto" ${editing?.status === 'aberto' ? 'selected' : ''}>Aberto</option>
        <option value="em analise" ${editing?.status === 'em analise' ? 'selected' : ''}>Em analise</option>
        <option value="resolvido" ${editing?.status === 'resolvido' ? 'selected' : ''}>Resolvido</option>
      </select></label>
      <label><span>Pedido vinculado</span><input name="relatedOrderId" type="text" maxlength="32" value="${editing?.relatedOrderId || ''}" placeholder="Ex.: order_123" /></label>
      <label><span>Canal</span><input name="channel" type="text" maxlength="32" value="${editing?.channel || 'site'}" /></label>
      <label><span>Responsavel</span><input name="owner" type="text" maxlength="32" value="${editing?.owner || 'Equipe Ops'}" /></label>
      <label class="admin-field-wide"><span>Nota interna</span><textarea name="note">${editing?.note || ''}</textarea></label>
    </div>
    <div class="admin-workspace-actions">
      <small>Tickets ajudam a testar o fluxo de suporte e a operacao diaria.</small>
      <div class="admin-workspace-action-row">
        ${editing ? '<button type="button" data-admin-cancel-edit>Cancelar edicao</button>' : ''}
        <button type="submit">${editing ? 'Salvar ticket' : 'Abrir ticket'}</button>
      </div>
    </div>
  `;
  els.adminWorkspaceForm.onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(els.adminWorkspaceForm);
    const ownerEmail = String(form.get('ownerEmail') || '').trim().toLowerCase();
    const next = {
      id: editing?.id || createAdminEntryId('ticket'),
      subject: String(form.get('subject') || '').trim(),
      userName: String(form.get('userName') || '').trim(),
      ownerEmail,
      userEmail: ownerEmail,
      relatedItemId: String(form.get('relatedItemId') || '').trim(),
      relatedOrderId: String(form.get('relatedOrderId') || '').trim(),
      priority: String(form.get('priority') || 'media'),
      status: String(form.get('status') || 'aberto'),
      channel: String(form.get('channel') || '').trim(),
      owner: String(form.get('owner') || '').trim(),
      note: String(form.get('note') || '').trim(),
      createdAt: editing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const collection = [...adminOperationsConfig.tickets];
    const index = collection.findIndex((entry) => entry.id === next.id);
    if (index >= 0) collection[index] = next;
    else collection.unshift(next);
    adminOperationsConfig.tickets = collection;
    saveAdminOperationsConfig();
    appendAdminAudit(`Ticket ${next.subject} salvo no suporte local.`, 'Suporte');
    showToast(editing ? 'Ticket atualizado.' : 'Ticket criado.', 'success');
    resetAdminWorkspaceEditor();
    renderAdminPage();
  };
  els.adminWorkspaceForm.querySelector('[data-admin-cancel-edit]')?.addEventListener('click', () => {
    resetAdminWorkspaceEditor();
    renderAdminPage();
  });
  const ticketUserInput = els.adminWorkspaceForm.querySelector('[name="userName"]');
  const ticketOwnerSelect = els.adminWorkspaceForm.querySelector('[name="ownerEmail"]');
  ticketOwnerSelect?.addEventListener('change', (event) => {
    if (editing) return;
    const email = String(event.target.value || '').trim().toLowerCase();
    const linkedUser = authUsers[email];
    if (linkedUser && ticketUserInput) ticketUserInput.value = linkedUser.name || linkedUser.email || '';
  });
  const cards = records.map((entry) =>
    createWorkspaceRecordCard({
      eyebrow: `${entry.channel} // ${entry.owner}`,
      title: `${entry.subject} // ${entry.userName}`,
      copy: `${entry.note || 'Sem nota interna.'}${entry.ownerEmail ? ` Conta vinculada: ${entry.ownerEmail}.` : ''}${entry.relatedOrderId ? ` Pedido: ${entry.relatedOrderId}.` : ''}`,
      badges: [
        { label: entry.priority, tone: entry.priority === 'alta' ? 'tone-off' : entry.priority === 'media' ? 'tone-warn' : 'tone-live' },
        { label: entry.status, tone: toneClassForStatus(entry.status) },
        ...(entry.ownerEmail ? [{ label: 'Conta vinculada', tone: 'tone-live' }] : []),
        ...(entry.relatedItemId ? [{ label: itemNameForId(entry.relatedItemId) }] : []),
      ],
      actions: [
        { label: 'Editar', onClick: () => { state.adminEditorId = entry.id; renderAdminPage(); } },
        ...(entry.relatedItemId ? [{ label: 'Abrir item', onClick: () => { location.hash = '#items'; state.query = itemNameForId(entry.relatedItemId); render(); } }] : []),
        ...(entry.relatedOrderId ? [{ label: 'Abrir pedidos', onClick: () => { state.adminSection = 'pedidos'; saveAdminUiState(); renderAdminPage(); } }] : []),
        { label: 'Avancar', onClick: () => {
          const flow = ['aberto', 'em analise', 'resolvido'];
          entry.status = flow[(flow.indexOf(entry.status) + 1) % flow.length];
          entry.updatedAt = new Date().toISOString();
          saveAdminOperationsConfig();
          appendAdminAudit(`Ticket ${entry.subject} mudou para ${entry.status}.`, 'Suporte');
          renderAdminPage();
        } },
        { label: 'Excluir', tone: 'danger', onClick: () => {
          adminOperationsConfig.tickets = adminOperationsConfig.tickets.filter((record) => record.id !== entry.id);
          saveAdminOperationsConfig();
          appendAdminAudit(`Ticket ${entry.subject} removido.`, 'Suporte');
          showToast('Ticket removido.', 'success');
          resetAdminWorkspaceEditor();
          renderAdminPage();
        } },
      ],
    }),
  );
  els.adminWorkspaceList.replaceChildren(...(cards.length ? cards : [createUtilityEmptyCard('Sem tickets', 'Abra tickets de teste para validar a operacao de suporte.')] ));
}

function renderAdminTeamWorkspace() {
  const records = [...adminOperationsConfig.team]
    .filter((entry) => adminMatchesQuery([entry.name, entry.role, entry.shift, entry.status, entry.contact]))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));
  const editing = adminOperationsConfig.team.find((entry) => entry.id === state.adminEditorId) || null;
  renderAdminWorkspaceShell({
    formTitle: editing ? 'Editar membro da equipe' : 'Cadastrar membro da equipe',
    formMeta: 'Distribua responsabilidade e acompanhe o plantao local.',
    statsTitle: 'Equipe',
    statsMeta: 'Gestao',
    listTitle: 'Roster operacional',
    listMeta: workspaceRecordCountLabel(records.length, 'membro', 'membros'),
    stats: [
      { label: 'Membros', value: formatNumber(adminOperationsConfig.team.length), meta: 'cadastros' },
      { label: 'Online', value: formatNumber(adminOperationsConfig.team.filter((entry) => entry.status === 'online').length), meta: 'em turno' },
      { label: 'Standby', value: formatNumber(adminOperationsConfig.team.filter((entry) => entry.status === 'standby').length), meta: 'aguardando' },
      { label: 'Turnos', value: formatNumber(new Set(adminOperationsConfig.team.map((entry) => entry.shift).filter(Boolean)).size), meta: 'faixas ativas' },
    ],
  });
  els.adminWorkspaceForm.innerHTML = `
    <div class="admin-workspace-field-grid">
      <label><span>Nome</span><input name="name" type="text" maxlength="48" value="${editing?.name || ''}" required /></label>
      <label><span>Funcao</span><input name="role" type="text" maxlength="40" value="${editing?.role || ''}" required /></label>
      <label><span>Turno</span><input name="shift" type="text" maxlength="24" value="${editing?.shift || ''}" /></label>
      <label><span>Status</span><select name="status">
        <option value="online" ${editing?.status === 'online' ? 'selected' : ''}>Online</option>
        <option value="standby" ${editing?.status === 'standby' ? 'selected' : ''}>Standby</option>
        <option value="offline" ${editing?.status === 'offline' ? 'selected' : ''}>Offline</option>
      </select></label>
      <label class="admin-field-wide"><span>Contato</span><input name="contact" type="text" maxlength="48" value="${editing?.contact || ''}" /></label>
    </div>
    <div class="admin-workspace-actions">
      <small>A equipe aqui funciona como roster interno do painel offline.</small>
      <div class="admin-workspace-action-row">
        ${editing ? '<button type="button" data-admin-cancel-edit>Cancelar edicao</button>' : ''}
        <button type="submit">${editing ? 'Salvar membro' : 'Cadastrar membro'}</button>
      </div>
    </div>
  `;
  els.adminWorkspaceForm.onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(els.adminWorkspaceForm);
    const next = {
      id: editing?.id || createAdminEntryId('team'),
      name: String(form.get('name') || '').trim(),
      role: String(form.get('role') || '').trim(),
      shift: String(form.get('shift') || '').trim(),
      status: String(form.get('status') || 'online'),
      contact: String(form.get('contact') || '').trim(),
    };
    const collection = [...adminOperationsConfig.team];
    const index = collection.findIndex((entry) => entry.id === next.id);
    if (index >= 0) collection[index] = next;
    else collection.unshift(next);
    adminOperationsConfig.team = collection;
    saveAdminOperationsConfig();
    appendAdminAudit(`Membro ${next.name} salvo na equipe local.`, 'Equipe');
    showToast(editing ? 'Equipe atualizada.' : 'Membro cadastrado.', 'success');
    resetAdminWorkspaceEditor();
    renderAdminPage();
  };
  els.adminWorkspaceForm.querySelector('[data-admin-cancel-edit]')?.addEventListener('click', () => {
    resetAdminWorkspaceEditor();
    renderAdminPage();
  });
  const cards = records.map((entry) =>
    createWorkspaceRecordCard({
      eyebrow: `${entry.role} // ${entry.shift || 'sem turno'}`,
      title: entry.name,
      copy: entry.contact || 'Sem contato definido.',
      badges: [
        { label: entry.status, tone: toneClassForStatus(entry.status) },
        { label: entry.role },
      ],
      actions: [
        { label: 'Editar', onClick: () => { state.adminEditorId = entry.id; renderAdminPage(); } },
        { label: 'Trocar status', onClick: () => {
          const flow = ['online', 'standby', 'offline'];
          entry.status = flow[(flow.indexOf(entry.status) + 1) % flow.length];
          saveAdminOperationsConfig();
          appendAdminAudit(`Status de ${entry.name} mudou para ${entry.status}.`, 'Equipe');
          renderAdminPage();
        } },
        { label: 'Excluir', tone: 'danger', onClick: () => {
          adminOperationsConfig.team = adminOperationsConfig.team.filter((record) => record.id !== entry.id);
          saveAdminOperationsConfig();
          appendAdminAudit(`Membro ${entry.name} removido da equipe local.`, 'Equipe');
          showToast('Membro removido.', 'success');
          resetAdminWorkspaceEditor();
          renderAdminPage();
        } },
      ],
    }),
  );
  els.adminWorkspaceList.replaceChildren(...(cards.length ? cards : [createUtilityEmptyCard('Sem equipe registrada', 'Cadastre membros para planejar a operacao interna.')] ));
}

function renderAdminStreamersWorkspace() {
  const records = [...adminOperationsConfig.streamers]
    .filter((entry) => adminMatchesQuery([entry.name, entry.platform, entry.status, entry.code, entry.note]))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));
  const editing = adminOperationsConfig.streamers.find((entry) => entry.id === state.adminEditorId) || null;
  renderAdminWorkspaceShell({
    formTitle: editing ? 'Editar streamer' : 'Cadastrar streamer',
    formMeta: 'Rastreie creators, codigos e status de ativacao.',
    statsTitle: 'Creators',
    statsMeta: 'Relacionamento',
    listTitle: 'Streamers acompanhados',
    listMeta: workspaceRecordCountLabel(records.length, 'creator', 'creators'),
    stats: [
      { label: 'Creators', value: formatNumber(adminOperationsConfig.streamers.length), meta: 'pipeline' },
      { label: 'Ativos', value: formatNumber(adminOperationsConfig.streamers.filter((entry) => entry.status === 'ativo').length), meta: 'em campanha' },
      { label: 'Prospects', value: formatNumber(adminOperationsConfig.streamers.filter((entry) => entry.status === 'prospect').length), meta: 'em avaliacao' },
      { label: 'Plataformas', value: formatNumber(new Set(adminOperationsConfig.streamers.map((entry) => entry.platform).filter(Boolean)).size), meta: 'alcance' },
    ],
  });
  els.adminWorkspaceForm.innerHTML = `
    <div class="admin-workspace-field-grid">
      <label><span>Nome</span><input name="name" type="text" maxlength="48" value="${editing?.name || ''}" required /></label>
      <label><span>Plataforma</span><input name="platform" type="text" maxlength="24" value="${editing?.platform || ''}" required /></label>
      <label><span>Status</span><select name="status">
        <option value="ativo" ${editing?.status === 'ativo' ? 'selected' : ''}>Ativo</option>
        <option value="prospect" ${editing?.status === 'prospect' ? 'selected' : ''}>Prospect</option>
        <option value="pausado" ${editing?.status === 'pausado' ? 'selected' : ''}>Pausado</option>
      </select></label>
      <label><span>Alcance</span><input name="reach" type="text" maxlength="16" value="${editing?.reach || ''}" /></label>
      <label><span>Codigo</span><input name="code" type="text" maxlength="20" value="${editing?.code || ''}" /></label>
      <label class="admin-field-wide"><span>Observacao</span><textarea name="note">${editing?.note || ''}</textarea></label>
    </div>
    <div class="admin-workspace-actions">
      <small>Streamers podem virar parceiros comerciais ou de awareness.</small>
      <div class="admin-workspace-action-row">
        ${editing ? '<button type="button" data-admin-cancel-edit>Cancelar edicao</button>' : ''}
        <button type="submit">${editing ? 'Salvar creator' : 'Cadastrar creator'}</button>
      </div>
    </div>
  `;
  els.adminWorkspaceForm.onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(els.adminWorkspaceForm);
    const next = {
      id: editing?.id || createAdminEntryId('streamer'),
      name: String(form.get('name') || '').trim(),
      platform: String(form.get('platform') || '').trim(),
      status: String(form.get('status') || 'prospect'),
      reach: String(form.get('reach') || '').trim(),
      code: String(form.get('code') || '').trim(),
      note: String(form.get('note') || '').trim(),
    };
    const collection = [...adminOperationsConfig.streamers];
    const index = collection.findIndex((entry) => entry.id === next.id);
    if (index >= 0) collection[index] = next;
    else collection.unshift(next);
    adminOperationsConfig.streamers = collection;
    saveAdminOperationsConfig();
    appendAdminAudit(`Streamer ${next.name} salvo no pipeline local.`, 'Streamer');
    showToast(editing ? 'Streamer atualizado.' : 'Streamer cadastrado.', 'success');
    resetAdminWorkspaceEditor();
    renderAdminPage();
  };
  els.adminWorkspaceForm.querySelector('[data-admin-cancel-edit]')?.addEventListener('click', () => {
    resetAdminWorkspaceEditor();
    renderAdminPage();
  });
  const cards = records.map((entry) =>
    createWorkspaceRecordCard({
      eyebrow: `${entry.platform} // alcance ${entry.reach || 'n/d'}`,
      title: entry.name,
      copy: `${entry.code ? `Codigo ${entry.code}. ` : ''}${entry.note || 'Sem observacoes.'}`,
      badges: [
        { label: entry.status, tone: toneClassForStatus(entry.status) },
        { label: entry.platform },
      ],
      actions: [
        { label: 'Editar', onClick: () => { state.adminEditorId = entry.id; renderAdminPage(); } },
        { label: entry.status === 'ativo' ? 'Pausar' : 'Ativar', onClick: () => {
          entry.status = entry.status === 'ativo' ? 'pausado' : 'ativo';
          saveAdminOperationsConfig();
          appendAdminAudit(`Streamer ${entry.name} mudou para ${entry.status}.`, 'Streamer');
          renderAdminPage();
        } },
        { label: 'Excluir', tone: 'danger', onClick: () => {
          adminOperationsConfig.streamers = adminOperationsConfig.streamers.filter((record) => record.id !== entry.id);
          saveAdminOperationsConfig();
          appendAdminAudit(`Streamer ${entry.name} removido.`, 'Streamer');
          showToast('Streamer removido.', 'success');
          resetAdminWorkspaceEditor();
          renderAdminPage();
        } },
      ],
    }),
  );
  els.adminWorkspaceList.replaceChildren(...(cards.length ? cards : [createUtilityEmptyCard('Sem streamers', 'Cadastre creators para acompanhar prospect e campanhas.')] ));
}

function renderAdminPartnershipsWorkspace() {
  const records = [...adminOperationsConfig.partnerships]
    .filter((entry) => adminMatchesQuery([entry.name, entry.category, entry.status, entry.benefit, entry.owner]))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));
  const editing = adminOperationsConfig.partnerships.find((entry) => entry.id === state.adminEditorId) || null;
  renderAdminWorkspaceShell({
    formTitle: editing ? 'Editar parceria' : 'Cadastrar parceria',
    formMeta: 'Relacao com comunidades, marcas e criadores.',
    statsTitle: 'Parcerias',
    statsMeta: 'Relacionamento',
    listTitle: 'Parcerias mapeadas',
    listMeta: workspaceRecordCountLabel(records.length, 'parceria', 'parcerias'),
    stats: [
      { label: 'Parcerias', value: formatNumber(adminOperationsConfig.partnerships.length), meta: 'pipeline' },
      { label: 'Ativas', value: formatNumber(adminOperationsConfig.partnerships.filter((entry) => entry.status === 'ativa').length), meta: 'rodando' },
      { label: 'Negociacao', value: formatNumber(adminOperationsConfig.partnerships.filter((entry) => entry.status === 'negociacao').length), meta: 'em conversa' },
      { label: 'Categorias', value: formatNumber(new Set(adminOperationsConfig.partnerships.map((entry) => entry.category).filter(Boolean)).size), meta: 'frentes' },
    ],
  });
  els.adminWorkspaceForm.innerHTML = `
    <div class="admin-workspace-field-grid">
      <label><span>Nome</span><input name="name" type="text" maxlength="48" value="${editing?.name || ''}" required /></label>
      <label><span>Categoria</span><input name="category" type="text" maxlength="24" value="${editing?.category || ''}" required /></label>
      <label><span>Status</span><select name="status">
        <option value="ativa" ${editing?.status === 'ativa' ? 'selected' : ''}>Ativa</option>
        <option value="negociacao" ${editing?.status === 'negociacao' ? 'selected' : ''}>Negociacao</option>
        <option value="pausada" ${editing?.status === 'pausada' ? 'selected' : ''}>Pausada</option>
      </select></label>
      <label><span>Responsavel</span><input name="owner" type="text" maxlength="32" value="${editing?.owner || ''}" /></label>
      <label class="admin-field-wide"><span>Beneficio</span><textarea name="benefit">${editing?.benefit || ''}</textarea></label>
    </div>
    <div class="admin-workspace-actions">
      <small>Parcerias servem para campanhas, distribuicao e legitimidade da comunidade.</small>
      <div class="admin-workspace-action-row">
        ${editing ? '<button type="button" data-admin-cancel-edit>Cancelar edicao</button>' : ''}
        <button type="submit">${editing ? 'Salvar parceria' : 'Cadastrar parceria'}</button>
      </div>
    </div>
  `;
  els.adminWorkspaceForm.onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(els.adminWorkspaceForm);
    const next = {
      id: editing?.id || createAdminEntryId('partner'),
      name: String(form.get('name') || '').trim(),
      category: String(form.get('category') || '').trim(),
      status: String(form.get('status') || 'negociacao'),
      owner: String(form.get('owner') || '').trim(),
      benefit: String(form.get('benefit') || '').trim(),
    };
    const collection = [...adminOperationsConfig.partnerships];
    const index = collection.findIndex((entry) => entry.id === next.id);
    if (index >= 0) collection[index] = next;
    else collection.unshift(next);
    adminOperationsConfig.partnerships = collection;
    saveAdminOperationsConfig();
    appendAdminAudit(`Parceria ${next.name} salva no admin local.`, 'Parceria');
    showToast(editing ? 'Parceria atualizada.' : 'Parceria cadastrada.', 'success');
    resetAdminWorkspaceEditor();
    renderAdminPage();
  };
  els.adminWorkspaceForm.querySelector('[data-admin-cancel-edit]')?.addEventListener('click', () => {
    resetAdminWorkspaceEditor();
    renderAdminPage();
  });
  const cards = records.map((entry) =>
    createWorkspaceRecordCard({
      eyebrow: `${entry.category} // ${entry.owner || 'sem responsavel'}`,
      title: entry.name,
      copy: entry.benefit || 'Sem beneficio descrito.',
      badges: [
        { label: entry.status, tone: toneClassForStatus(entry.status) },
        { label: entry.category },
      ],
      actions: [
        { label: 'Editar', onClick: () => { state.adminEditorId = entry.id; renderAdminPage(); } },
        { label: entry.status === 'ativa' ? 'Pausar' : 'Ativar', onClick: () => {
          entry.status = entry.status === 'ativa' ? 'pausada' : 'ativa';
          saveAdminOperationsConfig();
          appendAdminAudit(`Parceria ${entry.name} mudou para ${entry.status}.`, 'Parceria');
          renderAdminPage();
        } },
        { label: 'Excluir', tone: 'danger', onClick: () => {
          adminOperationsConfig.partnerships = adminOperationsConfig.partnerships.filter((record) => record.id !== entry.id);
          saveAdminOperationsConfig();
          appendAdminAudit(`Parceria ${entry.name} removida.`, 'Parceria');
          showToast('Parceria removida.', 'success');
          resetAdminWorkspaceEditor();
          renderAdminPage();
        } },
      ],
    }),
  );
  els.adminWorkspaceList.replaceChildren(...(cards.length ? cards : [createUtilityEmptyCard('Sem parcerias', 'Cadastre acordos e iniciativas para o marketplace.')] ));
}

function renderAdminUsersWorkspace() {
  const { users } = buildAdminDataset();
  const records = [...users]
    .filter((user) => adminMatchesQuery([user.name, user.email, user.role, user.history.map((entry) => entry.kind).join(' ')]))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));
  const editing = records.find((user) => user.email === state.adminEditorId) || records[0] || null;
  const selectedWallet = editing?.wallet || buildDefaultWallet();
  const selectedInventoryUnits = (editing?.inventory || []).reduce((total, entry) => total + Number(entry.quantity || 0), 0);
  const totalCash = users.reduce((total, user) => total + Number(user.wallet?.cashBalance || 0), 0);
  const totalPoints = users.reduce((total, user) => total + Number(user.wallet?.pointBalance || 0), 0);
  const admins = users.filter((user) => (user.role || 'user') === 'admin').length;
  const inventoryUsers = users.filter((user) => (user.inventory || []).some((entry) => Number(entry.quantity || 0) > 0)).length;
  renderAdminWorkspaceShell({
    formTitle: 'Aplicar ajuste em conta',
    formMeta: 'Saldo, pontos e cargo com reflexo imediato no pacote local.',
    statsTitle: 'Saude da base',
    statsMeta: 'Usuarios',
    listTitle: 'Contas operacionais',
    listMeta: workspaceRecordCountLabel(records.length, 'conta', 'contas'),
    stats: [
      { label: 'Usuarios', value: formatNumber(users.length), meta: 'contas locais' },
      { label: 'Admins', value: formatNumber(admins), meta: 'acesso elevado' },
      { label: 'Carteira total', value: formatNumber(totalCash), meta: 'saldo real' },
      { label: 'Pontos totais', value: formatNumber(totalPoints), meta: `${formatNumber(inventoryUsers)} com inventario` },
    ],
  });
  els.adminWorkspaceForm.innerHTML = `
    <div class="admin-workspace-field-grid">
      <label><span>Conta</span><select name="email">${records.map((user) => `<option value="${user.email}" ${editing?.email === user.email ? 'selected' : ''}>${user.name} // ${user.email}</option>`).join('')}</select></label>
      <label><span>Cargo</span><select name="role" ${editing?.email === defaultAdminEmail ? 'disabled' : ''}>
        <option value="user" ${(editing?.role || 'user') === 'user' ? 'selected' : ''}>Usuario</option>
        <option value="admin" ${editing?.role === 'admin' ? 'selected' : ''}>Admin</option>
      </select></label>
      <label><span>Ajuste saldo real</span><input name="cashDelta" type="number" step="1" value="0" /></label>
      <label><span>Ajuste pontos</span><input name="pointDelta" type="number" step="1" value="0" /></label>
      <label><span>Saldo atual</span><input type="text" value="${formatNumber(selectedWallet.cashBalance)}" readonly /></label>
      <label><span>Pontos atuais</span><input type="text" value="${formatNumber(selectedWallet.pointBalance)}" readonly /></label>
      <label class="admin-field-wide"><span>Nota do ajuste</span><textarea name="note" placeholder="Ex.: bonus de teste, correção manual, upgrade de cargo.">Ajuste manual pelo admin local.</textarea></label>
    </div>
    <div class="admin-workspace-actions">
      <small>${editing ? `${editing.name} tem ${formatNumber(editing.history.length)} eventos e ${formatNumber(selectedInventoryUnits)} itens no inventario.` : 'Selecione uma conta para operar.'}</small>
      <div class="admin-workspace-action-row">
        <button type="button" data-admin-open-user-modal ${editing ? '' : 'disabled'}>Abrir modal completo</button>
        <button type="button" data-admin-clear-user-inventory ${editing ? '' : 'disabled'}>Limpar inventario</button>
        <button type="submit" ${editing ? '' : 'disabled'}>Aplicar ajuste</button>
      </div>
    </div>
  `;
  const emailSelect = els.adminWorkspaceForm.querySelector('[name="email"]');
  emailSelect?.addEventListener('change', (event) => {
    state.adminEditorId = String(event.target.value || '');
    renderAdminPage();
  });
  els.adminWorkspaceForm.onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(els.adminWorkspaceForm);
    const email = String(form.get('email') || '').trim();
    const target = authUsers[email];
    if (!target) return;
    const nextRole = String(form.get('role') || target.role || 'user');
    const cashDelta = Number(form.get('cashDelta') || 0);
    const pointDelta = Number(form.get('pointDelta') || 0);
    const note = String(form.get('note') || '').trim() || 'Ajuste manual pelo admin local.';
    const wallet = loadWalletStateFor(email);
    const nextWallet = {
      cashBalance: Math.max(0, Number(wallet.cashBalance || 0) + cashDelta),
      pointBalance: Math.max(0, Number(wallet.pointBalance || 0) + pointDelta),
    };
    saveWalletStateFor(email, nextWallet);
    if (email !== defaultAdminEmail) {
      target.role = nextRole;
      saveAuthUsers();
    }
    if (cashDelta || pointDelta || note) {
      appendHistoryEntryFor(email, {
        kind: 'Admin',
        itemName: 'Ajuste de conta',
        copy: `${note} Saldo ${cashDelta >= 0 ? '+' : ''}${formatNumber(Math.abs(cashDelta))} // pontos ${pointDelta >= 0 ? '+' : ''}${formatNumber(Math.abs(pointDelta))}.`,
        date: new Date().toLocaleDateString('pt-BR'),
        amount: Math.abs(cashDelta) || Math.abs(pointDelta) || 0,
      });
    }
    appendAdminAudit(`Conta ${target.name} ajustada: saldo ${cashDelta >= 0 ? '+' : ''}${cashDelta}, pontos ${pointDelta >= 0 ? '+' : ''}${pointDelta}, cargo ${target.role}.`, 'Usuario');
    showToast('Conta atualizada no admin.', 'success');
    state.adminEditorId = email;
    renderAdminPage();
  };
  els.adminWorkspaceForm.querySelector('[data-admin-open-user-modal]')?.addEventListener('click', () => {
    if (editing) openAdminUserModal(editing.email);
  });
  els.adminWorkspaceForm.querySelector('[data-admin-clear-user-inventory]')?.addEventListener('click', () => {
    if (!editing) return;
    clearUserInventory(editing.email);
    appendAdminAudit(`Inventario de ${editing.name} limpo no workspace de usuarios.`, 'Inventario');
    showToast('Inventario limpo no admin.', 'success');
    renderAdminPage();
  });
  const cards = records.map((user) => {
    const wallet = user.wallet || buildDefaultWallet();
    const inventoryUnits = (user.inventory || []).reduce((total, entry) => total + Number(entry.quantity || 0), 0);
    const lastEvent = user.history[0];
    return createWorkspaceRecordCard({
      eyebrow: `${user.email} // ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'local'}`,
      title: user.name,
      copy: `Saldo ${formatNumber(wallet.cashBalance)} // pontos ${formatNumber(wallet.pointBalance)} // ${lastEvent ? `ultimo evento: ${lastEvent.kind}` : 'sem historico recente'}.`,
      badges: [
        { label: user.role || 'user', tone: (user.role || 'user') === 'admin' ? 'tone-live' : 'tone-warn' },
        { label: `${formatNumber(user.history.length)} eventos` },
        { label: `${formatNumber(inventoryUnits)} itens`, tone: inventoryUnits ? 'tone-live' : 'tone-off' },
      ],
      actions: [
        { label: 'Ajustar', onClick: () => { state.adminEditorId = user.email; renderAdminPage(); } },
        { label: 'Editar modal', onClick: () => openAdminUserModal(user.email) },
        {
          label: user.email === defaultAdminEmail ? 'Admin fixo' : (user.role || 'user') === 'admin' ? 'Virar usuario' : 'Virar admin',
          disabled: user.email === defaultAdminEmail,
          onClick: () => {
            const target = authUsers[user.email];
            if (!target || target.email === defaultAdminEmail) return;
            target.role = (target.role || 'user') === 'admin' ? 'user' : 'admin';
            saveAuthUsers();
            appendAdminAudit(`Cargo de ${target.name} alterado para ${target.role}.`, 'Usuario');
            renderAdminPage();
          },
        },
        {
          label: 'Limpar historico',
          onClick: () => {
            clearUserHistory(user.email);
            appendAdminAudit(`Historico de ${user.name} limpo no workspace de usuarios.`, 'Historico');
            renderAdminPage();
          },
        },
        {
          label: 'Limpar inventario',
          onClick: () => {
            clearUserInventory(user.email);
            appendAdminAudit(`Inventario de ${user.name} limpo no workspace de usuarios.`, 'Inventario');
            renderAdminPage();
          },
        },
      ],
    });
  });
  els.adminWorkspaceList.replaceChildren(...(cards.length ? cards : [createUtilityEmptyCard('Sem contas locais', 'Crie usuarios para começar a operar esse modulo.')] ));
}

function renderAdminPage() {
  const { users, allHistory, allInventory } = buildAdminDataset();
  const adminCount = users.filter((user) => (user.role || 'user') === 'admin').length;
  const totalFavorites = users.reduce((total, user) => total + user.favorites.length, 0);
  const totalCashSpent = allHistory.filter((entry) => entry.kind === 'Compra').reduce((total, entry) => total + parseHistoryAmount(entry), 0);
  const totalPointsSpent = allHistory.filter((entry) => entry.kind === 'Resgate').reduce((total, entry) => total + parseHistoryAmount(entry), 0);
  const inventoryUnits = allInventory.reduce((total, entry) => total + Number(entry.quantity || 0), 0);
  const readyMaps = data.maps.filter((map) => map.status === 'ready').length;
  const monthSeries = (list, matcher, amountMode = false) =>
    Array.from({ length: 12 }, (_, month) =>
      list
        .filter((entry) => {
          const stamp = new Date(entry.timestamp || entry.createdAt || Date.now());
          return !Number.isNaN(stamp.getTime()) && stamp.getMonth() === month && matcher(entry);
        })
        .reduce((total, entry) => total + (amountMode ? parseHistoryAmount(entry) : 1), 0),
    );
  const monthlyActivity = monthSeries(allHistory, () => true);
  const monthlyCash = monthSeries(allHistory, (entry) => entry.kind === 'Compra', true);
  const monthlyPoints = monthSeries(allHistory, (entry) => entry.kind === 'Resgate', true);
  const monthlyLogins = monthSeries(allHistory, (entry) => entry.kind === 'Sessao');
  const monthlyAccounts = Array.from({ length: 12 }, (_, month) =>
    users.filter((user) => {
      const stamp = new Date(user.createdAt || Date.now());
      return !Number.isNaN(stamp.getTime()) && stamp.getMonth() === month;
    }).length,
  );
  const monthIndex = new Date().getMonth();
  const previousMonthIndex = (monthIndex + 11) % 12;
  const comparisonActivity = monthlyActivity.map((_, index) => monthlyActivity[(index + 11) % 12]);
  const pendingOrders = adminOperationsConfig.orders.filter((entry) => ['pendente', 'processando'].includes(entry.status));
  const lowStockItems = adminOperationsConfig.products.filter((entry) => Number(entry.stock || 0) <= Number(entry.threshold || 0));
  const openTickets = adminOperationsConfig.tickets.filter((entry) => entry.status !== 'resolvido');
  const pausedBoxes = adminOperationsConfig.lootboxes.filter((entry) => entry.status !== 'ativa');
  const hotCoupons = adminOperationsConfig.coupons.filter((entry) => Number(entry.limit || 0) > 0 && Number(entry.used || 0) >= Math.max(1, Number(entry.limit || 0) - 5));
  const activeCoupons = getActiveCoupons();
  const activeLootboxes = getActiveLootboxes();
  const activeStreamers = adminOperationsConfig.streamers.filter((entry) => entry.status === 'ativo');
  const activePartnerships = adminOperationsConfig.partnerships.filter((entry) => entry.status === 'ativa');
  const teamOnline = adminOperationsConfig.team.filter((entry) => entry.status === 'online');
  const typeDistribution = Object.entries(
    data.items.reduce((acc, item) => {
      const type = getType(item);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value], index) => ({
      label,
      value,
      color: ['#2cc3dd', '#f6c33b', '#8e63f7', '#17c28f', '#ff7a1a'][index],
    }));

  const metrics = [
    { label: 'Receita real', value: formatNumber(totalCashSpent), meta: 'Compras em saldo', trend: buildTrendMeta(monthlyCash[monthIndex], monthlyCash[previousMonthIndex]) },
    { label: 'Pontos usados', value: formatNumber(totalPointsSpent), meta: 'Resgates locais', trend: buildTrendMeta(monthlyPoints[monthIndex], monthlyPoints[previousMonthIndex]) },
    { label: 'Usuarios locais', value: formatNumber(users.length), meta: 'Contas no navegador', trend: buildTrendMeta(monthlyAccounts[monthIndex], monthlyAccounts[previousMonthIndex]) },
    { label: 'Admins', value: formatNumber(adminCount), meta: 'Acesso elevado', trend: buildTrendMeta(adminCount, adminCount) },
    { label: 'Favoritos salvos', value: formatNumber(totalFavorites), meta: 'Wishlist dos usuarios', trend: buildTrendMeta(totalFavorites, Math.max(totalFavorites - 2, 0)) },
    { label: 'Inventario total', value: formatNumber(inventoryUnits), meta: 'Itens registrados', trend: buildTrendMeta(inventoryUnits, Math.max(inventoryUnits - 1, 0)) },
    { label: 'Historicos', value: formatNumber(allHistory.length), meta: 'Eventos consolidados', trend: buildTrendMeta(monthlyActivity[monthIndex], monthlyActivity[previousMonthIndex]) },
    { label: 'Mapas prontos', value: formatNumber(readyMaps), meta: 'Cobertura local', trend: buildTrendMeta(readyMaps, readyMaps) },
  ];

  els.adminStatusLabel.textContent = isAdmin() ? 'Admin autenticado' : 'Acesso restrito';
  els.adminUserCount.textContent = formatNumber(users.length);
  els.adminRoleCount.textContent = `${typeDistribution.length} tipos`;
  els.adminHistoryCount.textContent = formatNumber(allHistory.length);
  els.adminInventoryCount.textContent = formatNumber(inventoryUnits);
  const rosterLabelMap = {
    dashboard: workspaceRecordCountLabel(users.length, 'conta', 'contas'),
    pedidos: `${pendingOrders.length} pedidos ativos`,
    produtos: `${adminOperationsConfig.products.length} produtos geridos`,
    estoque: `${lowStockItems.length} alertas de estoque`,
    cupons: `${activeCoupons.length} cupons ativos`,
    lootboxes: `${activeLootboxes.length} boxes ativas`,
    usuarios: workspaceRecordCountLabel(users.length, 'conta local', 'contas locais'),
    equipe: `${teamOnline.length} online agora`,
    suporte: `${openTickets.length} tickets abertos`,
    streamers: `${activeStreamers.length} creators ativos`,
    parcerias: `${activePartnerships.length} parcerias ativas`,
  };
  els.adminRosterCount.textContent = rosterLabelMap[state.adminSection] || `${users.length} contas`;
  els.adminMapCountLabel.textContent = `${data.maps.length} mapas`;
  els.adminAdminCount.textContent = `${adminCount} admins`;
  els.adminChartTitle.textContent = 'Fluxo mensal';
  els.adminChartTotal.textContent = `${formatNumber(allHistory.length)} eventos`;
  if (els.adminSearchInput && els.adminSearchInput.value !== state.adminQuery) {
    els.adminSearchInput.value = state.adminQuery;
  }
  syncAdminContentForm();

  const metricCards = metrics.map(
    (metric) => `
      <article class="admin-metric-card">
        <span>${metric.label}</span>
        <strong>${metric.value}</strong>
        <em class="admin-metric-trend ${metric.trend.tone}">${metric.trend.label}</em>
        <small>${metric.meta}</small>
      </article>`,
  );
  els.adminMetricGrid.innerHTML = metricCards.join('');

  const alerts = [
    pendingOrders.length
      ? {
          label: 'Pedidos aguardando',
          title: `${formatNumber(pendingOrders.length)} em fila`,
          copy: 'Existem pedidos pendentes ou em processamento no marketplace local.',
          section: 'pedidos',
          tone: 'tone-warn',
        }
      : null,
    lowStockItems.length
      ? {
          label: 'Reposicao',
          title: `${formatNumber(lowStockItems.length)} itens baixos`,
          copy: 'Produtos no limite de estoque pedem reposicao ou ajuste de vitrine.',
          section: 'estoque',
          tone: 'tone-off',
        }
      : null,
    openTickets.length
      ? {
          label: 'Suporte',
          title: `${formatNumber(openTickets.length)} tickets abertos`,
          copy: 'A fila de atendimento local ainda tem chamados para tratar.',
          section: 'suporte',
          tone: 'tone-warn',
        }
      : null,
    hotCoupons.length
      ? {
          label: 'Cupons',
          title: `${formatNumber(hotCoupons.length)} proximos do limite`,
          copy: 'Alguns cupons estao perto de esgotar o limite configurado.',
          section: 'cupons',
          tone: 'tone-warn',
        }
      : null,
    pausedBoxes.length
      ? {
          label: 'Loot boxes',
          title: `${formatNumber(pausedBoxes.length)} pausadas`,
          copy: 'Existem caixas prontas, mas fora do ar no momento.',
          section: 'lootboxes',
          tone: 'tone-off',
        }
      : null,
  ].filter(Boolean);
  updateAdminNavBadges({
    alerts: alerts.length,
    pendingOrders: pendingOrders.length,
    publishedProducts: adminOperationsConfig.products.filter((entry) => entry.visibility === 'publicado').length,
    lowStockItems: lowStockItems.length,
    activeCoupons: activeCoupons.length,
    activeLootboxes: activeLootboxes.length,
    users: users.length,
    teamOnline: teamOnline.length,
    openTickets: openTickets.length,
    activeStreamers: activeStreamers.length,
    activePartnerships: activePartnerships.length,
  });
  els.adminAlertCount.textContent = `${formatNumber(alerts.length)} alertas`;
  const alertCards = alerts.map((alert) =>
    createWorkspaceRecordCard({
      eyebrow: alert.label,
      title: alert.title,
      copy: alert.copy,
      badges: [{ label: adminSectionMeta[alert.section]?.guideTitle || alert.section, tone: alert.tone }],
      actions: [
        {
          label: 'Abrir modulo',
          onClick: () => {
            state.adminSection = alert.section;
            resetAdminWorkspaceEditor();
            renderAdminPage();
          },
        },
      ],
    }),
  );
  els.adminAlertList.replaceChildren(
    ...(alertCards.length ? alertCards : [createUtilityEmptyCard('Sem alertas criticos', 'A operacao local esta saudavel neste momento.')]),
  );

  const quickLinkEntries = [
    { section: 'pedidos', label: 'Pedidos', count: pendingOrders.length, countLabel: workspaceRecordCountLabel(pendingOrders.length, 'pedido ativo', 'pedidos ativos'), copy: 'Fila de compra e entrega local.' },
    { section: 'produtos', label: 'Produtos', count: adminOperationsConfig.products.filter((entry) => entry.visibility === 'publicado').length, countLabel: workspaceRecordCountLabel(adminOperationsConfig.products.filter((entry) => entry.visibility === 'publicado').length, 'produto publicado', 'produtos publicados'), copy: 'Preco, pontos e visibilidade.' },
    { section: 'estoque', label: 'Estoque', count: lowStockItems.length, countLabel: workspaceRecordCountLabel(lowStockItems.length, 'alerta de estoque', 'alertas de estoque'), copy: 'Reposicao, limite e localizacao.' },
    { section: 'cupons', label: 'Cupons', count: getActiveCoupons().length, countLabel: workspaceRecordCountLabel(getActiveCoupons().length, 'cupom ativo', 'cupons ativos'), copy: 'Beneficios e campanhas ativas.' },
    { section: 'lootboxes', label: 'Loot Boxes', count: getActiveLootboxes().length, countLabel: workspaceRecordCountLabel(getActiveLootboxes().length, 'box ativa', 'boxes ativas'), copy: 'Caixas premium disponiveis.' },
    { section: 'usuarios', label: 'Usuarios', count: users.length, countLabel: workspaceRecordCountLabel(users.length, 'conta local', 'contas locais'), copy: 'Contas, cargos, saldo e historico.' },
    { section: 'suporte', label: 'Suporte', count: openTickets.length, countLabel: workspaceRecordCountLabel(openTickets.length, 'ticket aberto', 'tickets abertos'), copy: 'Fila de atendimento local.' },
  ];
  const quickCards = quickLinkEntries.map((entry) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'utility-card';
    button.innerHTML = `<small>${entry.countLabel || formatNumber(entry.count)}</small><strong>${entry.label}</strong><p>${entry.copy}</p>`;
    button.addEventListener('click', () => {
      state.adminSection = entry.section;
      resetAdminWorkspaceEditor();
      renderAdminPage();
    });
    return button;
  });
  els.adminQuickLinks.replaceChildren(...quickCards);

  const campaignEntries = [
    ...activeCoupons.map((entry) => ({
      kind: 'Cupom',
      title: entry.code,
      copy: `${formatNumber(entry.rewardPoints || 0)} pts // ${formatNumber(entry.discountValue || 0)} saldo // ${formatNumber(entry.used || 0)}/${formatNumber(entry.limit || 0)} usos.`,
      tone: Number(entry.limit || 0) > 0 && Number(entry.used || 0) >= Math.max(1, Number(entry.limit || 0) - 5) ? 'tone-warn' : 'tone-live',
      actionSection: 'cupons',
    })),
    ...activeLootboxes.map((entry) => ({
      kind: 'Loot Box',
      title: entry.name,
      copy: `${formatNumber(entry.costCash || 0)} real // ${formatNumber(entry.costPoints || 0)} pontos // ${entry.rarity}.`,
      tone: 'tone-live',
      actionSection: 'lootboxes',
    })),
  ];
  els.adminCampaignCount.textContent = `${formatNumber(campaignEntries.length)} ativos`;
  const campaignCards = campaignEntries.slice(0, 6).map((entry) =>
    createWorkspaceRecordCard({
      eyebrow: entry.kind,
      title: entry.title,
      copy: entry.copy,
      badges: [{ label: entry.kind, tone: entry.tone }],
      actions: [
        {
          label: 'Abrir modulo',
          onClick: () => {
            state.adminSection = entry.actionSection;
            resetAdminWorkspaceEditor();
            renderAdminPage();
          },
        },
      ],
    }),
  );
  els.adminCampaignList.replaceChildren(
    ...(campaignCards.length ? campaignCards : [createUtilityEmptyCard('Sem campanhas ativas', 'Ative cupons ou loot boxes para acompanhar campanhas daqui.')]),
  );

  els.adminStockWatchCount.textContent = `${formatNumber(lowStockItems.length)} itens`;
  const stockWatchCards = lowStockItems
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    .slice(0, 6)
    .map((entry) =>
      createWorkspaceRecordCard({
        eyebrow: `${entry.location || 'Deposito local'} // limite ${formatNumber(entry.threshold || 0)}`,
        title: itemNameForId(entry.itemId),
        copy: `${formatNumber(entry.stock || 0)} unidades restantes. ${entry.note || 'Reposicao recomendada.'}`,
        badges: [
          { label: `Estoque ${formatNumber(entry.stock || 0)}`, tone: Number(entry.stock || 0) === 0 ? 'tone-off' : 'tone-warn' },
        ],
        actions: [
          {
            label: '+1 unidade',
            onClick: () => {
              adjustItemStock(entry.itemId, 1);
              appendAdminAudit(`Reposicao rapida aplicada em ${itemNameForId(entry.itemId)}.`, 'Estoque');
              render();
            },
          },
          {
            label: 'Abrir estoque',
            onClick: () => {
              state.adminSection = 'estoque';
              state.adminEditorId = entry.id;
              renderAdminPage();
            },
          },
        ],
      }),
    );
  els.adminStockWatchList.replaceChildren(
    ...(stockWatchCards.length ? stockWatchCards : [createUtilityEmptyCard('Sem risco de reposicao', 'Os produtos monitorados estao acima do limite configurado.')]),
  );

  els.adminRevenueChart.innerHTML = renderMiniLineChart(monthlyActivity, comparisonActivity, monthIndex);
  const filteredTypeDistribution = typeDistribution.filter((entry) => adminMatchesQuery([entry.label]));
  const donut = renderDonutChart(filteredTypeDistribution.length ? filteredTypeDistribution : typeDistribution);
  els.adminCategoryChart.innerHTML = donut.chart;
  els.adminCategoryLegend.innerHTML = donut.legend;

  const recentUsers = users
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .filter((user) => adminMatchesQuery([user.name, user.email, user.role]))
    .slice(0, 6)
    .map((user) => {
      const card = document.createElement('article');
      card.className = 'profile-history-card';
      card.innerHTML = `
        <small>${user.role || 'user'} // ${user.createdAt ? new Date(user.createdAt).toLocaleString('pt-BR') : 'local'}</small>
        <strong>${user.name}</strong>
        <p>${user.email}</p>
      `;
      return card;
    });
  els.adminRecentUsersList.replaceChildren(
    ...(recentUsers.length ? recentUsers : [createUtilityEmptyCard('Sem contas recentes', 'Novos usuarios locais aparecerao aqui.')]),
  );

  const topItems = [...data.items]
    .filter((item) => adminMatchesQuery([item.name, getType(item), rarityLabels[getRarity(item)], item.description]))
    .filter((item) => isItemVisible(item))
    .sort((a, b) => Number(cashValueFor(b) || 0) - Number(cashValueFor(a) || 0))
    .slice(0, 5)
    .map((item) => {
      const card = document.createElement('article');
      card.className = 'profile-history-card';
      card.innerHTML = `
        <small>${getType(item)} // ${rarityLabels[getRarity(item)]}</small>
        <strong>${item.name}</strong>
        <p>Valor real ${formatNumber(cashValueFor(item))} // pontos ${formatNumber(tradeValueFor(item))}</p>
      `;
      return card;
    });
  els.adminTopItemsList.replaceChildren(...topItems);

  const channelData = [
    { label: 'Compras real', value: totalCashSpent, series: monthlyCash, trend: buildTrendMeta(monthlyCash[monthIndex], monthlyCash[previousMonthIndex]) },
    { label: 'Resgates pontos', value: totalPointsSpent, series: monthlyPoints, trend: buildTrendMeta(monthlyPoints[monthIndex], monthlyPoints[previousMonthIndex]) },
    { label: 'Eventos login', value: allHistory.filter((entry) => entry.kind === 'Sessao').length, series: monthlyLogins, trend: buildTrendMeta(monthlyLogins[monthIndex], monthlyLogins[previousMonthIndex]) },
    { label: 'Contas criadas', value: allHistory.filter((entry) => entry.kind === 'Conta').length, series: monthlyAccounts, trend: buildTrendMeta(monthlyAccounts[monthIndex], monthlyAccounts[previousMonthIndex]) },
  ];
  els.adminChannelBars.innerHTML = channelData
    .map(
      (entry) => `
        <article class="admin-bar-card">
          <div class="admin-bar-head"><span>${entry.label}</span><strong>${formatNumber(entry.value)}</strong></div>
          <div class="admin-sparkline">${renderSparkline(entry.series)}</div>
          <small class="admin-sparkline-meta ${entry.trend.tone}">${entry.trend.label}</small>
        </article>`,
    )
    .join('');

  els.adminMapStatusList.innerHTML = data.maps
    .filter((map) => adminMatchesQuery([map.name, map.id, map.status]))
    .map(
      (map) => `
        <article class="admin-status-card ${map.status === 'ready' ? 'ready' : 'pending'}">
          <strong>${map.name}</strong>
          <span>${map.status === 'ready' ? 'Imagem local' : 'Pendente'}</span>
        </article>`,
    )
    .join('');

  const activityFeed = [...allHistory]
    .filter((entry) => adminMatchesQuery([entry.kind, entry.userName, entry.itemName, entry.copy]))
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, 8)
    .map((entry) => {
      const card = document.createElement('article');
      card.className = 'profile-history-card';
      card.innerHTML = `
        <small>${entry.kind} // ${entry.userName || 'Usuario local'}</small>
        <strong>${entry.itemName}</strong>
        <p>${entry.copy}</p>
      `;
      return card;
    });
  els.adminActivityFeed.replaceChildren(
    ...(activityFeed.length ? activityFeed : [createUtilityEmptyCard('Sem atividade recente', 'Compras, resgates e sessoes vao aparecer aqui.')]),
  );

  const rosterCards = users
    .filter((user) => {
      if (state.adminSection === 'estoque') {
        return (user.inventory || []).reduce((total, entry) => total + Number(entry.quantity || 0), 0) > 0;
      }
      if (state.adminSection === 'equipe') {
        return (user.role || 'user') === 'admin';
      }
      return true;
    })
    .filter((user) => adminMatchesQuery([user.name, user.email, user.role]))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((user) => {
      const wallet = user.wallet || buildDefaultWallet();
      const inventoryTotal = (user.inventory || []).reduce((total, entry) => total + Number(entry.quantity || 0), 0);
      const card = document.createElement('article');
      card.className = 'profile-history-card';
      card.innerHTML = `
        <small>${user.role || 'user'} // ${user.createdAt ? new Date(user.createdAt).toLocaleString('pt-BR') : 'local'}</small>
        <strong>${user.name}</strong>
        <p>${user.email}</p>
        <p>Saldo ${formatNumber(wallet.cashBalance)} // pontos ${formatNumber(wallet.pointBalance)} // inventario ${formatNumber(inventoryTotal)}</p>
        <div class="admin-user-row-actions">
          <button type="button" data-admin-edit="${user.email}">Editar</button>
          <button type="button" data-admin-toggle-role="${user.email}" ${user.email === defaultAdminEmail ? 'disabled' : ''}>${(user.role || 'user') === 'admin' ? 'Virar usuario' : 'Virar admin'}</button>
          <button type="button" data-admin-clear-history="${user.email}">Historico</button>
          <button type="button" data-admin-clear-inventory="${user.email}">Inventario</button>
        </div>
      `;
      const editButton = card.querySelector(`[data-admin-edit="${user.email}"]`);
      const roleButton = card.querySelector(`[data-admin-toggle-role="${user.email}"]`);
      const historyButton = card.querySelector(`[data-admin-clear-history="${user.email}"]`);
      const inventoryButton = card.querySelector(`[data-admin-clear-inventory="${user.email}"]`);
      editButton?.addEventListener('click', () => openAdminUserModal(user.email));
      roleButton?.addEventListener('click', () => {
        const target = authUsers[user.email];
        if (!target || target.email === defaultAdminEmail) return;
        target.role = (target.role || 'user') === 'admin' ? 'user' : 'admin';
        saveAuthUsers();
        appendAdminAudit(`Cargo de ${target.name} alterado para ${target.role}.`, 'Permissao');
        render();
        if (currentSession.email === target.email && target.role !== 'admin') renderRoute();
      });
      historyButton?.addEventListener('click', () => {
        clearUserHistory(user.email);
        appendAdminAudit(`Historico de ${user.name} foi limpo.`, 'Historico');
        showToast(`Historico de ${user.name} limpo.`, 'success');
        render();
      });
      inventoryButton?.addEventListener('click', () => {
        clearUserInventory(user.email);
        appendAdminAudit(`Inventario de ${user.name} foi limpo.`, 'Inventario');
        showToast(`Inventario de ${user.name} limpo.`, 'success');
        render();
      });
      return card;
    });
  els.adminUserList.replaceChildren(
    ...(rosterCards.length ? rosterCards : [createUtilityEmptyCard('Nada encontrado', 'A busca atual nao encontrou usuarios para este modulo.')]),
  );
  renderAdminWorkspace();
  updateAdminPanelVisibility();
}

function valuePerKgFor(item) {
  const weight = Number(item.weightKg || 0);
  const value = Number(item.value || 0);
  if (!weight || !value) return 0;
  return value / weight;
}

function findItemById(id) {
  return data.items.find((item) => item.id === id);
}

function itemNameForId(id) {
  return findItemById(id)?.name || String(id || '').replaceAll('_', ' ');
}

function applyDropSearch(dropId) {
  const item = findItemById(dropId);
  state.query = item?.name || String(dropId || '').replaceAll('_', ' ');
  state.rarity = 'all';
  state.type = 'all';
  els.searchInput.value = state.query;
  render();
  setRoute('items');
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const itemLookupByName = buildItemLookupByName();
const craftingSourceCatalog = buildCraftingSourceCatalog();
const craftableCatalog = buildCraftableCatalog(craftingSourceCatalog);
const recyclingCatalog = buildRecyclingCatalog();
const arcThreatOrder = ['Low', 'Moderate', 'High', 'Critical', 'Extreme', 'Unknown'];
const traderCatalog = [...new Set(data.trades.map((entry) => entry.trader).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

function buildItemLookupByName() {
  const map = new Map();
  data.items.forEach((item) => {
    [item.name, item.nameEn].filter(Boolean).forEach((name) => {
      map.set(normalizeText(name), item);
    });
  });
  return map;
}

function splitDescriptionList(chunk) {
  return String(chunk || '')
    .replace(/\n+/g, ' ')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function extractCraftTargets(description) {
  const regex = /usad[oa]s?\s+para\s+(?:fabricar|criar):\s*([^.;]+)/gi;
  const targets = [];
  for (const match of String(description || '').matchAll(regex)) {
    targets.push(...splitDescriptionList(match[1]));
  }
  return targets;
}

function extractRecycleOutputs(description) {
  const regex = /(?:pode\s+ser\s+reciclado\s+em|pode\s+reciclar\s+por|reciclar\s+gera)\s+([^.;]+)/gi;
  const outputs = [];
  for (const match of String(description || '').matchAll(regex)) {
    outputs.push(...splitDescriptionList(match[1]));
  }
  return outputs;
}

function resolveItemNameReference(label) {
  return itemLookupByName.get(normalizeText(label)) || null;
}

function buildCraftingSourceCatalog() {
  return data.items
    .map((item) => {
      const targets = extractCraftTargets(item.description);
      if (!targets.length) return null;
      return {
        item,
        targets: targets.map((label) => ({
          label,
          item: resolveItemNameReference(label),
        })),
      };
    })
    .filter(Boolean);
}

function buildCraftableCatalog(sourceCatalog) {
  const reverseMap = new Map();
  sourceCatalog.forEach((source) => {
    source.targets.forEach((target) => {
      const key = target.item?.id || normalizeText(target.label);
      if (!reverseMap.has(key)) reverseMap.set(key, []);
      reverseMap.get(key).push(source.item);
    });
  });

  return data.items
    .filter((item) => item.isCraftable)
    .map((item) => ({
      item,
      sources: reverseMap.get(item.id) || reverseMap.get(normalizeText(item.name)) || [],
    }));
}

function buildRecyclingCatalog() {
  return data.items
    .map((item) => {
      const outputs = extractRecycleOutputs(item.description);
      const recyclable =
        /recyclable/i.test(String(item.type || '')) ||
        item.isRecyclable ||
        outputs.length > 0;
      if (!recyclable) return null;
      return { item, outputs };
    })
    .filter(Boolean);
}

function getArcThreat(bot) {
  return arcThreatOrder.includes(bot.threat) ? bot.threat : 'Unknown';
}

function renderArcThreatFilters() {
  const counts = new Map();
  data.bots.forEach((bot) => {
    const threat = getArcThreat(bot);
    counts.set(threat, (counts.get(threat) || 0) + 1);
  });

  const buttons = [
    { id: 'all', label: 'Todas', count: data.bots.length },
    ...arcThreatOrder.filter((threat) => counts.has(threat)).map((threat) => ({
      id: threat,
      label: threat,
      count: counts.get(threat),
    })),
  ].map((entry) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `arc-threat-filter ${state.arcThreat === entry.id ? 'active' : ''}`;
    button.innerHTML = `<span>${entry.label}</span><small>${entry.count}</small>`;
    button.addEventListener('click', () => {
      state.arcThreat = entry.id;
      renderArcDatabase();
    });
    return button;
  });

  els.arcThreatFilters.replaceChildren(...buttons);
}

function getRarity(item) {
  return rarityOrder.includes(item.rarity) ? item.rarity : 'Unknown';
}

function getType(item) {
  return String(item.type || 'Item');
}

function getTopTypes() {
  const counts = new Map();
  data.items.forEach((item) => {
    const type = getType(item);
    counts.set(type, (counts.get(type) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
    .slice(0, 8);
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    if (state.sort === 'name-asc') return a.name.localeCompare(b.name, 'pt-BR');
    if (state.sort === 'type-asc') return String(a.type).localeCompare(String(b.type), 'pt-BR');
    if (state.sort === 'value-per-kg-desc') return valuePerKgFor(b) - valuePerKgFor(a);

    const av = Number(a.value || 0);
    const bv = Number(b.value || 0);
    return state.sort === 'value-asc' ? av - bv : bv - av;
  });
}

function getVisibleItems() {
  const query = normalizeText(state.query);
  return sortItems(
    data.items.filter((item) => {
      if (!isItemVisible(item)) return false;
      if (state.favoritesOnly && !favoriteItemIds.has(item.id)) return false;
      if (state.rarity !== 'all' && getRarity(item) !== state.rarity) return false;
      if (state.type !== 'all' && getType(item) !== state.type) return false;
      if (!query) return true;
      return normalizeText(`${item.name} ${item.nameEn} ${item.type} ${item.description}`).includes(query);
    }),
  );
}

function toggleFavoriteItem(itemId) {
  if (favoriteItemIds.has(itemId)) {
    favoriteItemIds.delete(itemId);
  } else {
    favoriteItemIds.add(itemId);
  }
  saveFavoriteItemIds();
  renderItems();
}

function renderRarityFilters() {
  els.raritySummary.textContent = state.rarity === 'all' ? 'Todos' : rarityLabels[state.rarity];

  const all = document.createElement('button');
  all.type = 'button';
  all.className = `chip ${state.rarity === 'all' ? 'active' : ''}`;
  all.style.setProperty('--chip-color', '#00d9ff');
  all.innerHTML = '<span>Todos</span><small>567 itens</small>';
  all.addEventListener('click', () => {
    state.rarity = 'all';
    els.rarityDropdown.open = false;
    render();
  });

  els.rarityFilters.replaceChildren(all);

  rarityOrder.forEach((rarity) => {
    const count = data.items.filter((item) => getRarity(item) === rarity).length;
    if (!count) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chip ${state.rarity === rarity ? 'active' : ''}`;
    button.style.setProperty('--chip-color', rarityColors[rarity]);
    button.innerHTML = `<span>${rarityLabels[rarity]}</span><small>${count} itens</small>`;
    button.addEventListener('click', () => {
      state.rarity = rarity;
      els.rarityDropdown.open = false;
      render();
    });
    els.rarityFilters.appendChild(button);
  });
}

function renderTypeFilters() {
  els.typeSummary.textContent = state.type === 'all' ? 'Todos' : state.type;

  const all = document.createElement('button');
  all.type = 'button';
  all.className = `chip ${state.type === 'all' ? 'active' : ''}`;
  all.style.setProperty('--chip-color', '#ffd400');
  all.innerHTML = '<span>Todos</span><small>Todos os tipos</small>';
  all.addEventListener('click', () => {
    state.type = 'all';
    els.typeDropdown.open = false;
    render();
  });

  els.typeFilters.replaceChildren(all);

  getTopTypes().forEach(([type, count]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chip ${state.type === type ? 'active' : ''}`;
    button.style.setProperty('--chip-color', '#00d9ff');
    button.innerHTML = `<span>${type}</span><small>${count} itens</small>`;
    button.addEventListener('click', () => {
      state.type = type;
      els.typeDropdown.open = false;
      render();
    });
    els.typeFilters.appendChild(button);
  });
}

function renderItems() {
  const visible = getVisibleItems();
  els.visibleCount.textContent = String(visible.length);
  els.totalCount.textContent = String(data.items.length);
  els.activeSort.textContent = `Sort: ${state.sort.replace('-', ' ')}`;
  els.favoriteToggleButton.classList.toggle('active', state.favoritesOnly);
  els.favoriteToggleButton.textContent = state.favoritesOnly ? 'Mostrando favoritos' : 'So favoritos';

  const cards = visible.slice(0, 60).map((item) => {
    const rarity = getRarity(item);
    const favoriteActive = favoriteItemIds.has(item.id);
    const productRecord = getAdminProductRecord(item.id);
    const visibility = itemVisibilityFor(item);
    const stockValue = itemStockFor(item);
    const threshold = itemThresholdFor(item);
    const lowStock = stockValue !== null && stockValue <= threshold;
    const outOfStock = stockValue !== null && stockValue <= 0;
    const card = document.createElement('article');
    card.className = `item-card${productRecord?.highlight ? ' featured' : ''}${visibility === 'limitado' ? ' limited' : ''}${outOfStock ? ' sold-out' : lowStock ? ' low-stock' : ''}`;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Abrir detalhe de ${item.name}`);
    card.style.setProperty('--rarity-color', rarityColors[rarity]);
    card.addEventListener('click', () => openItemModal(item));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openItemModal(item);
      }
    });

    const meta = document.createElement('div');
    meta.className = 'item-meta';
    meta.innerHTML = `<strong>${rarityLabels[rarity]}</strong><span>${item.isBlueprint ? 'Blueprint' : item.type}</span>`;

    const media = document.createElement('div');
    media.className = 'item-media';
    if (item.image) {
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = item.image;
      img.alt = item.name;
      media.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'placeholder';
      placeholder.textContent = item.name.slice(0, 1).toUpperCase();
      media.appendChild(placeholder);
    }
    const favorite = document.createElement('span');
    favorite.className = `favorite ${favoriteActive ? 'active' : ''}`;
    favorite.innerHTML = favoriteActive ? '&#9829;' : '&#9825;';
    favorite.setAttribute('role', 'button');
    favorite.setAttribute('aria-label', favoriteActive ? `Remover ${item.name} dos favoritos` : `Favoritar ${item.name}`);
    favorite.tabIndex = 0;
    favorite.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleFavoriteItem(item.id);
    });
    favorite.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        toggleFavoriteItem(item.id);
      }
    });
    media.appendChild(favorite);
    const marketBadges = document.createElement('div');
    marketBadges.className = 'item-market-badges';
    const badgeLabels = [
      productRecord?.highlight ? { label: 'Destaque', tone: 'featured' } : null,
      visibility === 'limitado' ? { label: 'Limitado', tone: 'limited' } : null,
      outOfStock ? { label: 'Sem estoque', tone: 'soldout' } : lowStock ? { label: 'Ultimas unidades', tone: 'warning' } : null,
    ].filter(Boolean);
    badgeLabels.forEach((entry) => {
      const badge = document.createElement('span');
      badge.className = `item-market-badge ${entry.tone}`;
      badge.textContent = entry.label;
      marketBadges.appendChild(badge);
    });
    if (badgeLabels.length) media.appendChild(marketBadges);

    const body = document.createElement('div');
    body.className = 'item-body';
    const stockLabel = stockValue === null ? 'Livre' : formatNumber(stockValue);
    body.innerHTML = `
      <div>
        <h3>${item.name}</h3>
        <p class="item-type">${item.type || 'Item'}</p>
      </div>
      <div class="value-grid">
        <div class="value-row value-row-real"><span>Valor real</span><strong>${formatNumber(cashValueFor(item))}</strong></div>
        <div class="value-row value-row-points"><span>Pontos do site</span><strong>${formatNumber(tradeValueFor(item))}</strong></div>
        <div class="value-row"><span>Estoque</span><strong>${stockLabel}</strong></div>
      </div>
      <div class="item-action-row">
        <button class="item-action-button" type="button" data-action="points" ${canAffordPoints(item) ? '' : 'disabled'}>Resgatar</button>
        <button class="item-action-button cash" type="button" data-action="cash" ${canAffordCash(item) ? '' : 'disabled'}>Comprar</button>
      </div>
    `;
    if (outOfStock || lowStock || visibility === 'limitado') {
      const marketLine = document.createElement('p');
      marketLine.className = `item-market-line${outOfStock ? ' soldout' : lowStock ? ' warning' : ''}`;
      marketLine.textContent = outOfStock
        ? 'Marketplace local sem estoque no momento.'
        : lowStock
          ? 'Estoque baixo monitorado pelo admin.'
          : 'Oferta limitada no marketplace local.';
      body.prepend(marketLine);
    }

    body.querySelector('[data-action="points"]')?.addEventListener('click', (event) => {
      event.stopPropagation();
      openItemModal(item);
      transactItem('points');
    });
    body.querySelector('[data-action="cash"]')?.addEventListener('click', (event) => {
      event.stopPropagation();
      openItemModal(item);
      transactItem('cash');
    });

    card.append(meta, media, body);
    return card;
  });

  if (!cards.length) {
    const empty = document.createElement('article');
    empty.className = 'item-card';
    empty.innerHTML = '<div class="item-body"><h3>Nenhum item encontrado</h3><p class="item-type">Ajuste busca ou filtros</p></div>';
    cards.push(empty);
  }

  els.itemGrid.replaceChildren(...cards);
}

function openItemModal(item) {
  activeModalItemId = item.id;
  const rarity = getRarity(item);
  els.modalKicker.textContent = `${rarityLabels[rarity]} // ${getType(item)}`;
  els.modalKicker.style.color = rarityColors[rarity];
  els.modalTitle.textContent = item.name;
  els.modalDescription.textContent = item.description || 'Descricao ainda nao publicada no dataset local.';
  els.modalBaseValue.textContent = formatNumber(cashValueFor(item));
  els.modalTradeValue.textContent = formatNumber(tradeValueFor(item));
  els.modalWeight.textContent = item.weightKg ? `${formatNumber(item.weightKg)} kg` : 'N/D';
  els.modalStack.textContent = itemStockFor(item) === null ? (item.stackSize ? formatNumber(item.stackSize) : 'Livre') : formatNumber(itemStockFor(item));

  if (item.image) {
    els.modalMedia.innerHTML = `<img src="${item.image}" alt="${item.name}" />`;
  } else {
    els.modalMedia.innerHTML = `<div class="placeholder">${item.name.slice(0, 1).toUpperCase()}</div>`;
  }

  const flags = [
    item.isWeapon ? 'Arma' : null,
    item.isBlueprint ? 'Blueprint' : null,
    item.isCraftable ? 'Craftavel' : null,
    item.isRecyclable ? 'Reciclavel' : null,
    favoriteItemIds.has(item.id) ? 'Favorito' : null,
    valuePerKgFor(item) ? `${formatNumber(Math.round(valuePerKgFor(item)))} por kg` : null,
    itemVisibilityFor(item) === 'limitado' ? 'Oferta limitada' : null,
    getAdminProductRecord(item.id)?.highlight ? 'Destaque do marketplace' : null,
    itemStockFor(item) !== null && itemStockFor(item) <= itemThresholdFor(item) && itemStockFor(item) > 0 ? 'Estoque baixo' : null,
  ].filter(Boolean);

  els.modalFlags.replaceChildren(
    ...(flags.length ? flags : ['Sem flags especiais']).map((flag) => {
      const chip = document.createElement('span');
      chip.textContent = flag;
      return chip;
    }),
  );

  const pointCost = Number(tradeValueFor(item) || 0);
  const cashCost = Number(cashValueFor(item) || 0);
  const loggedIn = isAuthenticated();
  const available = isItemVisible(item) && isItemInStock(item);
  const visibility = itemVisibilityFor(item);
  const stockValue = itemStockFor(item);
  const threshold = itemThresholdFor(item);
  const lowStock = stockValue !== null && stockValue <= threshold && stockValue > 0;
  els.redeemPointsButton.disabled = !loggedIn || !available || !pointCost || pointCost > getEffectivePointBalance();
  els.buyCashButton.disabled = !loggedIn || !available || !cashCost || cashCost > Number(walletState.cashBalance || 0);
  els.modalPurchaseStatus.textContent = !loggedIn
    ? 'Entre em uma conta local para salvar compras e resgates.'
    : !available
      ? 'Item indisponivel no marketplace local.'
      : `${visibility === 'limitado' ? 'Oferta limitada // ' : ''}Saldo real ${formatNumber(walletState.cashBalance)} // pontos ${formatNumber(getEffectivePointBalance())} // estoque ${stockValue === null ? 'livre' : formatNumber(stockValue)}${lowStock ? ' // ultimas unidades' : ''}`;

  els.itemModal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeItemModal() {
  activeModalItemId = '';
  els.itemModal.hidden = true;
  document.body.classList.remove('modal-open');
}

function transactItem(mode) {
  const item = findItemById(activeModalItemId);
  if (!item || !isAuthenticated()) return;
  if (!isItemVisible(item) || !isItemInStock(item)) {
    els.modalPurchaseStatus.textContent = 'Item indisponivel no marketplace local.';
    showToast('Item indisponivel no marketplace local.', 'warn');
    return;
  }

  const pointCost = Number(tradeValueFor(item) || 0);
  const cashCost = Number(cashValueFor(item) || 0);

  if (mode === 'points') {
    if (!pointCost || pointCost > getEffectivePointBalance()) {
      els.modalPurchaseStatus.textContent = 'Pontos insuficientes para resgatar este item.';
      showToast('Pontos insuficientes para resgatar este item.', 'warn');
      return;
    }
    walletState.pointBalance = Math.max(0, Number(walletState.pointBalance || 0) - pointCost);
    saveWalletState();
    adjustItemStock(item.id, -1);
    addInventoryItem(item, 'Resgate');
    appendAdminOrderFromAction(item, 'points');
    appendHistoryEntry({
      kind: 'Resgate',
      itemName: item.name,
      date: new Date().toLocaleString('pt-BR'),
      copy: `${formatNumber(pointCost)} pontos usados para resgatar o item.`,
    });
    els.modalPurchaseStatus.textContent = `Resgate realizado com ${formatNumber(pointCost)} pontos.`;
    showToast(`Resgate realizado: ${item.name}`, 'success');
  }

  if (mode === 'cash') {
    if (!cashCost || cashCost > Number(walletState.cashBalance || 0)) {
      els.modalPurchaseStatus.textContent = 'Saldo real insuficiente para comprar este item.';
      showToast('Saldo real insuficiente para comprar este item.', 'warn');
      return;
    }
    walletState.cashBalance = Math.max(0, Number(walletState.cashBalance || 0) - cashCost);
    saveWalletState();
    adjustItemStock(item.id, -1);
    addInventoryItem(item, 'Compra');
    appendAdminOrderFromAction(item, 'cash');
    appendHistoryEntry({
      kind: 'Compra',
      itemName: item.name,
      date: new Date().toLocaleString('pt-BR'),
      copy: `${formatNumber(cashCost)} de saldo real usados na compra do item.`,
    });
    els.modalPurchaseStatus.textContent = `Compra realizada por ${formatNumber(cashCost)} de saldo real.`;
    showToast(`Compra confirmada: ${item.name}`, 'success');
  }

  render();
  openItemModal(item);
}

function getRouteFromHash() {
  const route = window.location.hash.replace('#', '') || 'home';
  return ['home', 'items', 'trades', 'arcs', 'maps', 'crafting', 'recycling', 'profile', 'admin'].includes(route) ? route : 'home';
}

function setRoute(route) {
  if (window.location.hash.replace('#', '') !== route) {
    window.location.hash = route;
    return;
  }
  renderRoute();
}

function renderRoute() {
  let route = getRouteFromHash();
  if (route === 'admin' && !isAdmin()) {
    route = isAuthenticated() ? 'profile' : 'home';
    if (window.location.hash.replace('#', '') !== route) {
      window.location.hash = route;
      return;
    }
  }
  document.querySelectorAll('.page').forEach((page) => {
    page.classList.toggle('active-page', page.dataset.page === route);
  });
  document.querySelectorAll('.main-nav a').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${route}`);
  });
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderIntel() {
  const bots = data.bots.slice(0, 6).map((bot) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'bot-card';
    card.title = bot.weakness || bot.description || bot.name;
    const image = bot.image ? `<img src="${bot.image}" alt="${bot.name}" loading="lazy" />` : '<div class="placeholder">A</div>';
    const drop = Array.isArray(bot.drops) && bot.drops.length ? bot.drops[0] : '';
    card.innerHTML = `${image}<div><strong>${bot.name}</strong><small>${bot.threat || bot.type || 'ARC'}</small>${drop ? `<em>Drop: ${itemNameForId(drop)}</em>` : ''}</div>`;
    card.addEventListener('click', () => {
      if (drop) applyDropSearch(drop);
    });
    return card;
  });
  els.botList.replaceChildren(...bots);

  const maps = data.maps.map((map, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.innerHTML = `<strong>${map.name}</strong><small>Mapa ${String(index + 1).padStart(2, '0')}</small>`;
    return item;
  });
}

function renderMapsPage() {
  els.mapPageCount.textContent = String(data.maps.length);
  if (!data.maps.some((map) => map.id === state.selectedMapId)) {
    state.selectedMapId = data.maps[0]?.id || '';
  }

  const selectedMap = data.maps.find((map) => map.id === state.selectedMapId) || data.maps[0];
  const cards = data.maps.map((map, index) => {
    const card = document.createElement('button');
    const isSelected = map.id === selectedMap?.id;
    const statusLabel = map.status === 'ready' ? 'Imagem local' : 'Aguardando montagem';
    card.type = 'button';
    card.className = 'map-card';
    card.classList.toggle('active', isSelected);
    card.setAttribute('aria-pressed', String(isSelected));
    card.innerHTML = `
      <span>Mapa ${String(index + 1).padStart(2, '0')}</span>
      <strong>${map.name}</strong>
      <p>${map.label || statusLabel}</p>
    `;
    card.addEventListener('click', () => {
      state.selectedMapId = map.id;
      state.selectedMarkerId = '';
      state.selectedRouteId = '';
      renderMapsPage();
    });
    return card;
  });
  els.mapPageList.replaceChildren(...cards);

  if (!selectedMap) {
    els.selectedMapStatus.textContent = 'Map database';
    els.selectedMapTitle.textContent = 'Nenhum mapa encontrado';
    els.selectedMapBadge.textContent = 'Vazio';
    els.selectedMapMedia.innerHTML = '<div class="map-placeholder"><strong>N/D</strong><span>Sem dados de mapa.</span></div>';
    els.selectedMapDescription.textContent = '';
    els.markerFilters.replaceChildren();
    els.markerDetail.innerHTML = '';
    return;
  }

  const markers = getAllMapMarkers().filter((marker) => marker.mapId === selectedMap.id);
  const routes = getAllMapRoutes().filter((route) => route.mapId === selectedMap.id);
  const activeMarkers = state.showMarkers
    ? markers.filter((marker) => state.markerTypes.has(marker.type) && matchesMapSearch(marker) && matchesMapSource(marker))
    : [];
  const activeRoutes = state.showRoutes
    ? routes.filter((route) => state.routeTypes.has(route.type) && matchesMapSearch(route) && matchesMapSource(route))
    : [];
  els.markerCount.textContent = `${activeMarkers.length} pings / ${activeRoutes.length} rotas`;
  const pendingLocalChanges = customMapMarkers.length + customMapRoutes.length + hiddenMarkerIds.size;
  els.mapSyncStatus.textContent = pendingLocalChanges
    ? `${pendingLocalChanges} alteracoes locais pendentes. Use Salvar no pacote para fixar.`
    : 'Pings sincronizados com o pacote local.';
  els.addMarkerButton.classList.toggle('active', state.isAddingMarker);
  els.addRouteButton.classList.toggle('active', state.isAddingRoute);
  els.finishRouteButton.hidden = !state.isAddingRoute || state.draftRoutePoints.length < 2;
  els.cancelMarkerButton.hidden = !state.isAddingMarker && !state.isAddingRoute && !state.repositionMarkerId;
  els.restoreMarkersButton.hidden = hiddenMarkerIds.size === 0;
  els.mapZoomLabel.textContent = `Zoom ${Math.round(state.mapZoom * 100)}%`;
  syncMapFilterControls();
  renderMarkerFilters(markers);
  renderRouteFilters(routes);
  renderMapPresets();
  renderMapFilterSummary(activeMarkers, activeRoutes);
  positionMapFilterMenu();
  renderMarkerDetail(activeMarkers, activeRoutes);
  renderMarkerList(activeMarkers, activeRoutes);
  saveMapPreferences();

  els.selectedMapStatus.textContent = `Mapa ${String(selectedMap.index || 1).padStart(2, '0')} // ${selectedMap.label || 'ARC region'}`;
  els.selectedMapTitle.textContent = selectedMap.name;
  els.selectedMapBadge.textContent = selectedMap.status === 'ready' ? 'Imagem local' : 'Tiles pendentes';
  els.selectedMapBadge.classList.toggle('pending', selectedMap.status !== 'ready');
  els.selectedMapDescription.textContent = selectedMap.description || 'Mapa catalogado no pacote local.';

  if (selectedMap.image) {
    const emptyStateMarkup = renderEmptyMapState(activeMarkers, activeRoutes);
    const legendMarkup = renderMapLegend(activeMarkers, activeRoutes);
    els.selectedMapMedia.innerHTML = `
      <div class="map-stage ${state.isAddingMarker || state.isAddingRoute || state.repositionMarkerId ? 'adding-marker' : ''}">
        <img src="${selectedMap.image}" alt="Mapa ${selectedMap.name}" loading="lazy" />
        <svg class="route-layer" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
        <div class="marker-layer"></div>
        ${emptyStateMarkup}
        ${legendMarkup}
      </div>
    `;
    const stage = els.selectedMapMedia.querySelector('.map-stage');
    stage.style.width = `${state.mapZoom * 100}%`;
    stage.style.minHeight = `${500 * state.mapZoom}px`;
    stage.addEventListener('click', handleMapStageClick);
    const routeLayer = els.selectedMapMedia.querySelector('.route-layer');
    activeRoutes.forEach((route) => routeLayer.appendChild(createMapRoute(route)));
    if (state.isAddingRoute && state.draftRoutePoints.length) {
      routeLayer.appendChild(createDraftRoute());
    }
    const layer = els.selectedMapMedia.querySelector('.marker-layer');
    activeMarkers.forEach((marker) => layer.appendChild(createMapMarker(marker)));
    els.selectedMapMedia.querySelector('[data-map-empty-reset]')?.addEventListener('click', () => {
      resetMapFilters();
      renderMapsPage();
    });
  } else {
    els.selectedMapMedia.innerHTML = `
      <div class="map-placeholder">
        <strong>${selectedMap.name}</strong>
        <span>Imagem unica ainda nao montada. O dataset contem referencia do mapa e pode receber uma composicao de tiles depois.</span>
      </div>
    `;
  }
}

function markerId(marker) {
  return marker.id || `${marker.mapId}-${marker.type}-${marker.title}`;
}

function routeId(route) {
  return route.id || `${route.mapId}-${route.type}-${route.title}`;
}

function matchesMapSearch(entry) {
  if (!state.mapQuery) return true;
  const haystack = normalizeText(`${entry.title} ${entry.note} ${entry.type}`);
  return haystack.includes(normalizeText(state.mapQuery));
}

function matchesMapSource(entry) {
  if (state.sourceFilter === 'custom') return Boolean(entry.custom);
  if (state.sourceFilter === 'fixed') return !entry.custom;
  return true;
}

function routePointsAttr(points) {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function createMapRoute(route) {
  const category = routeCategories[route.type] || routeCategories.farm || fallbackMarkerCategory;
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.classList.add('map-route');
  if (state.selectedRouteId === routeId(route)) group.classList.add('active');
  group.style.setProperty('--route-color', category.color);

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  line.setAttribute('points', routePointsAttr(route.points || []));
  line.setAttribute('vector-effect', 'non-scaling-stroke');
  line.setAttribute('fill', 'none');

  const hit = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  hit.setAttribute('points', routePointsAttr(route.points || []));
  hit.setAttribute('vector-effect', 'non-scaling-stroke');
  hit.setAttribute('fill', 'none');
  hit.classList.add('route-hit');

  group.append(line, hit);
  group.addEventListener('click', (event) => {
    event.stopPropagation();
    state.selectedRouteId = routeId(route);
    state.selectedMarkerId = '';
    state.isAddingMarker = false;
    state.isAddingRoute = false;
    renderMapsPage();
  });
  return group;
}

function createDraftRoute() {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.classList.add('map-route', 'draft');
  group.style.setProperty('--route-color', '#ffd400');

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  line.setAttribute('points', routePointsAttr(state.draftRoutePoints));
  line.setAttribute('vector-effect', 'non-scaling-stroke');
  line.setAttribute('fill', 'none');
  group.appendChild(line);
  return group;
}

function handleMapStageClick(event) {
  if ((!state.isAddingMarker && !state.isAddingRoute && !state.repositionMarkerId) || event.target.closest('.map-marker')) return;

  const selectedMap = data.maps.find((map) => map.id === state.selectedMapId);
  if (!selectedMap?.image) return;

  const rect = event.currentTarget.getBoundingClientRect();
  const x = clampPercent(((event.clientX - rect.left) / rect.width) * 100);
  const y = clampPercent(((event.clientY - rect.top) / rect.height) * 100);

  if (state.isAddingRoute) {
    state.draftRoutePoints.push({ x, y });
    renderMapsPage();
    return;
  }

  if (state.repositionMarkerId) {
    customMapMarkers = customMapMarkers.map((marker) =>
      marker.id === state.repositionMarkerId ? { ...marker, x, y } : marker,
    );
    saveCustomMapMarkers();
    state.selectedMarkerId = state.repositionMarkerId;
    state.repositionMarkerId = '';
    renderMapsPage();
    return;
  }

  state.draftMarker = {
    mapId: selectedMap.id,
    type: Object.keys(markerCategories)[0] || 'route',
    x,
    y,
    title: '',
    note: '',
    custom: true,
  };
  openMarkerModal();
}

function openMarkerModal() {
  const draft = state.draftMarker;
  if (!draft) return;

  els.markerTypeInput.value = draft.type;
  els.markerTitleInput.value = draft.title;
  els.markerNoteInput.value = draft.note;
  els.markerPositionPreview.textContent = `x ${draft.x}% / y ${draft.y}%`;
  els.markerModal.hidden = false;
  document.body.classList.add('modal-open');
  window.setTimeout(() => els.markerTitleInput.focus(), 0);
}

function closeMarkerModal() {
  els.markerModal.hidden = true;
  document.body.classList.remove('modal-open');
}

function cancelMarkerAddMode() {
  state.isAddingMarker = false;
  state.isAddingRoute = false;
  state.draftMarker = null;
  state.draftRoutePoints = [];
  state.editingMarkerId = '';
  state.repositionMarkerId = '';
  closeMarkerModal();
  closeRouteModal();
  renderMapsPage();
}

function saveDraftMarker() {
  if (!state.draftMarker) return;

  const marker = {
    ...state.draftMarker,
    id: state.editingMarkerId || `custom-${Date.now()}`,
    type: els.markerTypeInput.value,
    title: els.markerTitleInput.value.trim(),
    note: els.markerNoteInput.value.trim() || 'Ping criado no editor local.',
    custom: true,
  };

  if (!marker.title) return;

  if (state.editingMarkerId) {
    customMapMarkers = customMapMarkers.map((entry) => (entry.id === state.editingMarkerId ? marker : entry));
  } else {
    customMapMarkers.push(marker);
  }
  saveCustomMapMarkers();
  state.markerTypes.add(marker.type);
  state.selectedMarkerId = marker.id;
  state.isAddingMarker = false;
  state.draftMarker = null;
  state.editingMarkerId = '';
  closeMarkerModal();
  renderMapsPage();
}

function editCustomMarker(marker) {
  state.draftMarker = { ...marker };
  state.editingMarkerId = marker.id;
  state.isAddingMarker = false;
  state.repositionMarkerId = '';
  openMarkerModal();
}

function startRepositionMarker(marker) {
  state.isAddingMarker = false;
  state.repositionMarkerId = marker.id;
  state.selectedMarkerId = marker.id;
  renderMapsPage();
}

function deleteCustomMarker(markerIdToDelete) {
  customMapMarkers = customMapMarkers.filter((marker) => marker.id !== markerIdToDelete);
  saveCustomMapMarkers();
  state.selectedMarkerId = '';
  renderMapsPage();
}

function openRouteModal() {
  if (state.draftRoutePoints.length < 2) return;
  els.routeTypeInput.value = Object.keys(routeCategories)[0] || 'farm';
  els.routeTitleInput.value = '';
  els.routeNoteInput.value = '';
  els.routePointPreview.textContent = `${state.draftRoutePoints.length} pontos`;
  els.routeModal.hidden = false;
  document.body.classList.add('modal-open');
  window.setTimeout(() => els.routeTitleInput.focus(), 0);
}

function closeRouteModal() {
  els.routeModal.hidden = true;
  document.body.classList.remove('modal-open');
}

function saveDraftRoute() {
  const title = els.routeTitleInput.value.trim();
  if (!title || state.draftRoutePoints.length < 2) return;
  const route = {
    id: `custom-route-${Date.now()}`,
    mapId: state.selectedMapId,
    type: els.routeTypeInput.value,
    title,
    note: els.routeNoteInput.value.trim() || 'Rota criada no editor local.',
    points: state.draftRoutePoints.map((point) => ({ ...point })),
    custom: true,
  };
  customMapRoutes.push(route);
  saveCustomMapRoutes();
  state.selectedRouteId = route.id;
  state.selectedMarkerId = '';
  state.isAddingRoute = false;
  state.draftRoutePoints = [];
  closeRouteModal();
  renderMapsPage();
}

function deleteCustomRoute(routeIdToDelete) {
  customMapRoutes = customMapRoutes.filter((route) => route.id !== routeIdToDelete);
  saveCustomMapRoutes();
  state.selectedRouteId = '';
  renderMapsPage();
}

function hideMarker(marker) {
  hiddenMarkerIds.add(markerId(marker));
  saveHiddenMarkerIds();
  state.selectedMarkerId = '';
  renderMapsPage();
}

function restoreHiddenMarkers() {
  hiddenMarkerIds = new Set();
  saveHiddenMarkerIds();
  renderMapsPage();
}

function copyMapText(text, label = 'Coordenada copiada') {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
  els.mapSyncStatus.textContent = label;
}

function copyMarkerCoordinates(marker) {
  copyMapText(`${marker.mapId}: x ${marker.x.toFixed(2)} / y ${marker.y.toFixed(2)}`, 'Coordenada do ping copiada.');
}

function copyRouteCoordinates(route) {
  const points = (route.points || []).map((point, index) => `${index + 1}: ${point.x.toFixed(2)}, ${point.y.toFixed(2)}`).join(' | ');
  copyMapText(`${route.mapId} // ${route.title}: ${points}`, 'Coordenadas da rota copiadas.');
}

function focusMarkerType(type) {
  state.showMarkers = true;
  state.markerTypes = new Set([type]);
  state.mapPreset = 'custom';
  state.selectedMarkerId = '';
  renderMapsPage();
}

function focusRouteType(type) {
  state.showRoutes = true;
  state.routeTypes = new Set([type]);
  state.mapPreset = 'custom';
  state.selectedRouteId = '';
  renderMapsPage();
}

function existingTypes(types, categoryMap) {
  if (types === 'all') return Object.keys(categoryMap);
  return (types || []).filter((type) => Object.prototype.hasOwnProperty.call(categoryMap, type));
}

function resetMapFilters() {
  state.mapQuery = '';
  state.markerTypes = new Set(Object.keys(markerCategories));
  state.routeTypes = new Set(Object.keys(routeCategories));
  state.showMarkers = true;
  state.showRoutes = true;
  state.sourceFilter = 'all';
  state.mapPreset = 'all';
  state.selectedMarkerId = '';
  state.selectedRouteId = '';
}

function renderEmptyMapState(activeMarkers, activeRoutes) {
  if (activeMarkers.length || activeRoutes.length) return '';
  if (state.isAddingMarker || state.isAddingRoute || state.repositionMarkerId) return '';

  let title = 'Nenhum resultado no mapa';
  let message = 'Os filtros atuais esconderam os pings e rotas desta area.';

  if (state.mapPreset === 'mine') {
    title = 'Sem pings criados por voce';
    message = 'Este mapa ainda nao tem marcacoes salvas no navegador.';
  } else if (state.mapPreset === 'routes') {
    title = 'Nenhuma rota ativa';
    message = 'Nao ha rotas visiveis com os filtros atuais.';
  } else if (state.mapQuery) {
    title = 'Busca sem resultado';
    message = `Nada encontrou por "${state.mapQuery}" neste mapa.`;
  }

  return `
    <div class="map-empty-state">
      <strong>${title}</strong>
      <span>${message}</span>
      <button type="button" data-map-empty-reset>Limpar filtros do mapa</button>
    </div>
  `;
}

function renderMapLegend(activeMarkers, activeRoutes) {
  const entries = [];
  const markerCounts = new Map();
  const routeCounts = new Map();

  activeMarkers.forEach((marker) => {
    markerCounts.set(marker.type, (markerCounts.get(marker.type) || 0) + 1);
  });
  activeRoutes.forEach((route) => {
    routeCounts.set(route.type, (routeCounts.get(route.type) || 0) + 1);
  });

  markerCounts.forEach((count, type) => {
    const category = markerCategories[type] || fallbackMarkerCategory;
    entries.push({ key: `marker-${type}`, label: category.label, count, color: category.color, kind: 'Ping' });
  });
  routeCounts.forEach((count, type) => {
    const category = routeCategories[type] || fallbackMarkerCategory;
    entries.push({ key: `route-${type}`, label: `Rota ${category.label}`, count, color: category.color, kind: 'Rota' });
  });

  if (!entries.length) return '';

  const preset = mapPresets.find((entry) => entry.id === state.mapPreset);
  const legendItems = entries
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
    .slice(0, 6)
    .map(
      (entry) => `
        <div class="map-legend-item" style="--legend-color: ${entry.color}">
          <span>${entry.kind}</span>
          <strong>${entry.label}</strong>
          <small>${entry.count}</small>
        </div>
      `,
    )
    .join('');

  return `
    <aside class="map-legend" aria-label="Legenda do mapa">
      <div class="map-legend-head">
        <span>${preset ? preset.label : 'Tudo'}</span>
        <strong>${activeMarkers.length} pings / ${activeRoutes.length} rotas</strong>
      </div>
      <div class="map-legend-list">${legendItems}</div>
    </aside>
  `;
}

function applyMapPreset(presetId) {
  const preset = mapPresets.find((entry) => entry.id === presetId) || mapPresets[0];
  resetMapFilters();
  state.mapPreset = preset.id;

  if (preset.markerTypes) {
    state.markerTypes = new Set(existingTypes(preset.markerTypes, markerCategories));
  }
  if (preset.routeTypes) {
    state.routeTypes = new Set(existingTypes(preset.routeTypes, routeCategories));
  }
  if (typeof preset.showMarkers === 'boolean') state.showMarkers = preset.showMarkers;
  if (typeof preset.showRoutes === 'boolean') state.showRoutes = preset.showRoutes;
  if (preset.sourceFilter) state.sourceFilter = preset.sourceFilter;

  renderMapsPage();
}

function createMarkerListButton(entry, category, label, isActive, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = isActive ? 'active' : '';
  button.style.setProperty('--marker-color', category.color);
  button.innerHTML = `<span>${label}</span><strong>${entry.title}</strong><small>${entry.custom ? 'Site' : 'Pacote'}</small>`;
  button.addEventListener('click', onClick);
  return button;
}

function appendMapListSection(body, title, entries, createButton) {
  const section = document.createElement('section');
  section.className = 'marker-list-section';
  const heading = document.createElement('h4');
  heading.innerHTML = `<span>${title}</span><strong>${entries.length}</strong>`;
  section.appendChild(heading);

  if (!entries.length) {
    const empty = document.createElement('span');
    empty.textContent = 'Nada ativo aqui.';
    section.appendChild(empty);
  } else {
    entries.forEach((entry) => section.appendChild(createButton(entry)));
  }
  body.appendChild(section);
}

function renderMarkerList(activeMarkers, routes = []) {
  const selectedMap = data.maps.find((map) => map.id === state.selectedMapId);
  const title = document.createElement('strong');
  title.textContent = selectedMap ? `Intel de ${selectedMap.name}` : 'Intel do mapa';

  const body = document.createElement('div');
  body.className = 'marker-list';

  if (!activeMarkers.length && !routes.length) {
    const empty = document.createElement('span');
    empty.textContent = 'Nenhum ping ou rota ativo neste mapa.';
    body.appendChild(empty);
  } else {
    const customMarkers = activeMarkers.filter((marker) => marker.custom);
    const fixedMarkers = activeMarkers.filter((marker) => !marker.custom);

    appendMapListSection(body, 'Rotas', routes, (route) => {
      const category = routeCategories[route.type] || routeCategories.farm || fallbackMarkerCategory;
      return createMarkerListButton(route, category, `Rota ${category.label}`, state.selectedRouteId === routeId(route), () => {
        state.selectedRouteId = routeId(route);
        state.selectedMarkerId = '';
        state.isAddingMarker = false;
        state.isAddingRoute = false;
        state.repositionMarkerId = '';
        renderMapsPage();
      });
    });

    appendMapListSection(body, 'Meus pings', customMarkers, (marker) => {
      const category = markerCategories[marker.type] || markerCategories.route || fallbackMarkerCategory;
      return createMarkerListButton(marker, category, category.label, state.selectedMarkerId === markerId(marker), () => {
        state.selectedMarkerId = markerId(marker);
        state.selectedRouteId = '';
        state.isAddingMarker = false;
        state.repositionMarkerId = '';
        renderMapsPage();
      });
    });

    appendMapListSection(body, 'Pacote fixo', fixedMarkers, (marker) => {
      const category = markerCategories[marker.type] || markerCategories.route || fallbackMarkerCategory;
      return createMarkerListButton(marker, category, category.label, state.selectedMarkerId === markerId(marker), () => {
        state.selectedMarkerId = markerId(marker);
        state.selectedRouteId = '';
        state.isAddingMarker = false;
        state.repositionMarkerId = '';
        renderMapsPage();
      });
    });
  }

  els.markerList.replaceChildren(title, body);
}

function renderMarkerFilters(markers) {
  const buttons = Object.entries(markerCategories).map(([type, category]) => {
    const count = markers.filter((marker) => marker.type === type && matchesMapSearch(marker) && matchesMapSource(marker)).length;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `marker-filter ${state.markerTypes.has(type) ? 'active' : ''}`;
    button.style.setProperty('--marker-color', category.color);
    button.disabled = count === 0;
    button.innerHTML = `<span>${category.label}</span><small>${count}</small>`;
    button.addEventListener('click', () => {
      state.mapPreset = 'custom';
      if (state.markerTypes.has(type)) {
        state.markerTypes.delete(type);
      } else {
        state.markerTypes.add(type);
      }
      state.selectedMarkerId = '';
      renderMapsPage();
    });
    return button;
  });
  els.markerFilters.replaceChildren(...buttons);
}

function renderRouteFilters(routes) {
  const buttons = Object.entries(routeCategories).map(([type, category]) => {
    const count = routes.filter((route) => route.type === type && matchesMapSearch(route) && matchesMapSource(route)).length;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `marker-filter ${state.routeTypes.has(type) ? 'active' : ''}`;
    button.style.setProperty('--marker-color', category.color);
    button.disabled = count === 0;
    button.innerHTML = `<span>${category.label}</span><small>${count}</small>`;
    button.addEventListener('click', () => {
      state.mapPreset = 'custom';
      if (state.routeTypes.has(type)) {
        state.routeTypes.delete(type);
      } else {
        state.routeTypes.add(type);
      }
      state.selectedRouteId = '';
      renderMapsPage();
    });
    return button;
  });
  els.routeFilters.replaceChildren(...buttons);
}

function renderMapPresets() {
  const buttons = mapPresets.map((preset) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `map-preset ${state.mapPreset === preset.id ? 'active' : ''}`;
    button.textContent = preset.label;
    button.addEventListener('click', () => applyMapPreset(preset.id));
    return button;
  });
  els.mapPresetFilters.replaceChildren(...buttons);
}

function syncMapFilterControls() {
  els.mapSearchInput.value = state.mapQuery;
  els.showMarkersInput.checked = state.showMarkers;
  els.showRoutesInput.checked = state.showRoutes;
  els.sourceFilterSelect.value = state.sourceFilter;
}

function renderMapFilterSummary(activeMarkers, activeRoutes) {
  const parts = [];
  if (state.mapPreset !== 'all') {
    const preset = mapPresets.find((entry) => entry.id === state.mapPreset);
    parts.push(preset ? preset.label.toLowerCase() : 'personalizado');
  }
  if (state.mapQuery) parts.push('busca');
  if (!state.showMarkers) parts.push('sem pings');
  if (!state.showRoutes) parts.push('sem rotas');
  if (state.sourceFilter === 'custom') parts.push('site');
  if (state.sourceFilter === 'fixed') parts.push('pacote');
  const hiddenMarkerTypes = state.showMarkers ? Object.keys(markerCategories).length - state.markerTypes.size : 0;
  const hiddenRouteTypes = state.showRoutes ? Object.keys(routeCategories).length - state.routeTypes.size : 0;
  if (hiddenMarkerTypes || hiddenRouteTypes) parts.push(`${hiddenMarkerTypes + hiddenRouteTypes} tipos off`);

  els.mapFilterSummary.textContent = parts.length
    ? `${parts.join(' // ')} - ${activeMarkers.length}/${activeRoutes.length}`
    : 'Tudo visivel';
}

function positionMapFilterMenu() {
  if (!els.mapFilterDropdown.open) return;
  window.requestAnimationFrame(() => {
    const menu = els.mapFilterDropdown.querySelector('.map-filter-menu');
    if (!menu) return;
    menu.style.maxHeight = '';
    menu.style.transform = '';

    const rect = menu.getBoundingClientRect();
    const availableHeight = Math.max(260, window.innerHeight - rect.top - 16);
    menu.style.maxHeight = `${availableHeight}px`;

    const overflowRight = rect.right - window.innerWidth + 16;
    const overflowLeft = 16 - rect.left;
    let shift = 0;
    if (overflowRight > 0) shift -= overflowRight;
    if (overflowLeft > 0) shift += overflowLeft;
    menu.style.transform = shift ? `translateX(${shift}px)` : '';
  });
}

function createMapMarker(marker) {
  const category = markerCategories[marker.type] || markerCategories.route || fallbackMarkerCategory;
  const id = markerId(marker);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `map-marker ${state.selectedMarkerId === id ? 'active' : ''}`;
  button.style.left = `${marker.x}%`;
  button.style.top = `${marker.y}%`;
  button.style.setProperty('--marker-color', category.color);
  button.setAttribute('aria-label', `${category.label}: ${marker.title}`);
  button.innerHTML = `<span>${category.label.slice(0, 1)}</span><strong>${marker.title}</strong>`;
  button.addEventListener('click', () => {
    state.selectedMarkerId = id;
    state.selectedRouteId = '';
    renderMapsPage();
  });
  return button;
}

function renderMarkerDetail(activeMarkers, routes = []) {
  const selectedRoute = routes.find((route) => routeId(route) === state.selectedRouteId);
  if (selectedRoute) {
    const category = routeCategories[selectedRoute.type] || routeCategories.farm || fallbackMarkerCategory;
    els.markerDetail.style.setProperty('--marker-color', category.color);
    els.markerDetail.innerHTML = `
      <small>${category.label}</small>
      <strong>${selectedRoute.title}</strong>
      <span>${selectedRoute.note || 'Rota sem nota.'}</span>
      <span>${selectedRoute.points.length} pontos no trajeto.</span>
    `;
    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'secondary-action';
    copyButton.textContent = 'Copiar pontos';
    copyButton.addEventListener('click', () => copyRouteCoordinates(selectedRoute));

    const focusButton = document.createElement('button');
    focusButton.type = 'button';
    focusButton.className = 'secondary-action';
    focusButton.textContent = 'Filtrar tipo';
    focusButton.addEventListener('click', () => focusRouteType(selectedRoute.type));

    els.markerDetail.append(copyButton, focusButton);
    if (selectedRoute.custom) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'danger-action';
      button.textContent = 'Excluir rota';
      button.addEventListener('click', () => deleteCustomRoute(selectedRoute.id));
      els.markerDetail.appendChild(button);
    }
    return;
  }

  const selected = activeMarkers.find((marker) => markerId(marker) === state.selectedMarkerId);
  if (!selected) {
    els.markerDetail.innerHTML = `
      <strong>Intel de marcador</strong>
      <span>${
        state.isAddingRoute
          ? `Clique no mapa para adicionar pontos da rota. ${state.draftRoutePoints.length} pontos marcados.`
          : state.repositionMarkerId
          ? 'Clique no mapa para escolher a nova posicao do ping.'
          : state.isAddingMarker
            ? 'Clique no mapa para posicionar um novo ping.'
            : 'Clique em um ponto ou rota no mapa para ver detalhes.'
      }</span>
    `;
    return;
  }

  const category = markerCategories[selected.type] || markerCategories.route || fallbackMarkerCategory;
  els.markerDetail.style.setProperty('--marker-color', category.color);
  els.markerDetail.innerHTML = `
    <small>${category.label}</small>
    <strong>${selected.title}</strong>
    <span>${selected.note}</span>
  `;
  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.className = 'secondary-action';
  copyButton.textContent = 'Copiar coordenada';
  copyButton.addEventListener('click', () => copyMarkerCoordinates(selected));

  const focusButton = document.createElement('button');
  focusButton.type = 'button';
  focusButton.className = 'secondary-action';
  focusButton.textContent = 'Filtrar tipo';
  focusButton.addEventListener('click', () => focusMarkerType(selected.type));

  els.markerDetail.append(copyButton, focusButton);
  if (selected.custom) {
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'secondary-action';
    editButton.textContent = 'Editar ping';
    editButton.addEventListener('click', () => editCustomMarker(selected));

    const moveButton = document.createElement('button');
    moveButton.type = 'button';
    moveButton.className = 'secondary-action';
    moveButton.textContent = 'Reposicionar';
    moveButton.addEventListener('click', () => startRepositionMarker(selected));

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'danger-action';
    button.textContent = 'Excluir ping';
    button.addEventListener('click', () => deleteCustomMarker(selected.id));
    els.markerDetail.append(editButton, moveButton, button);
  } else {
    const hideButton = document.createElement('button');
    hideButton.type = 'button';
    hideButton.className = 'danger-action';
    hideButton.textContent = 'Ocultar ping';
    hideButton.addEventListener('click', () => hideMarker(selected));
    els.markerDetail.appendChild(hideButton);
  }
}

function renderArcDatabase() {
  els.arcCount.textContent = String(data.bots.length);
  renderArcThreatFilters();

  const query = normalizeText(state.arcQuery);
  const bots = data.bots.filter((bot) => {
    const matchesThreat = state.arcThreat === 'all' || getArcThreat(bot) === state.arcThreat;
    const haystack = normalizeText(
      `${bot.name} ${bot.type} ${bot.threat} ${bot.description} ${bot.weakness} ${(bot.drops || []).map((dropId) => itemNameForId(dropId)).join(' ')}`,
    );
    return matchesThreat && (!query || haystack.includes(query));
  });

  els.arcVisibleCount.textContent = formatNumber(bots.length);
  els.arcDropCount.textContent = formatNumber(new Set(bots.flatMap((bot) => bot.drops || [])).size);

  const cards = bots.map((bot) => {
    const card = document.createElement('article');
    card.className = 'arc-card';
    const drops = Array.isArray(bot.drops) ? bot.drops.slice(0, 8) : [];
    const image = bot.image
      ? `<img src="${bot.image}" alt="${bot.name}" loading="lazy" />`
      : `<div class="placeholder">${bot.name.slice(0, 1)}</div>`;

    card.innerHTML = `
      <div class="arc-media">${image}</div>
      <div class="arc-body">
        <div class="arc-title-row">
          <div>
            <small>${bot.type || 'ARC unit'}</small>
            <h3>${bot.name}</h3>
          </div>
          <strong>${bot.threat || 'Unknown'}</strong>
        </div>
        <p>${bot.description || 'Descricao nao publicada.'}</p>
        <dl>
          <div><dt>Fraqueza</dt><dd>${bot.weakness || 'Nao informada'}</dd></div>
          <div><dt>Destroy XP</dt><dd>${formatNumber(bot.destroyXp)}</dd></div>
          <div><dt>Loot XP</dt><dd>${formatNumber(bot.lootXp)}</dd></div>
        </dl>
        <div class="drop-row"></div>
      </div>
    `;

    const dropRow = card.querySelector('.drop-row');
    if (drops.length) {
      drops.forEach((dropId) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = itemNameForId(dropId);
        button.addEventListener('click', () => applyDropSearch(dropId));
        dropRow.appendChild(button);
      });
    } else {
      const empty = document.createElement('span');
      empty.textContent = 'Sem drops catalogados';
      dropRow.appendChild(empty);
    }

    return card;
  });
  if (!cards.length) {
    const empty = document.createElement('article');
    empty.className = 'utility-card utility-card-empty arc-empty-card';
    empty.innerHTML = '<strong>Nenhum ARC encontrado</strong><p>Ajuste a busca ou o filtro de ameaca para ampliar a leitura.</p>';
    cards.push(empty);
  }
  els.arcGrid.replaceChildren(...cards);
}

function createUtilityChip(label, item = null) {
  const chip = document.createElement(item ? 'button' : 'span');
  chip.className = 'utility-chip';
  chip.textContent = label;
  if (item) {
    chip.type = 'button';
    chip.addEventListener('click', (event) => {
      event.stopPropagation();
      openItemModal(item);
    });
  }
  return chip;
}

function createUtilityEmptyCard(title, copy) {
  const card = document.createElement('article');
  card.className = 'utility-card utility-card-empty';
  card.innerHTML = `<strong>${title}</strong><p>${copy}</p>`;
  return card;
}

function pickLootboxReward(lootbox) {
  const pool = [...data.items]
    .filter((item) => isItemVisible(item))
    .sort((a, b) => {
      const rarityDelta = rarityOrder.indexOf(getRarity(b)) - rarityOrder.indexOf(getRarity(a));
      if (rarityDelta) return rarityDelta;
      return Number(cashValueFor(b) || 0) - Number(cashValueFor(a) || 0);
    });
  if (!pool.length) return null;
  if (lootbox?.rarity === 'lendario') return pool.find((item) => getRarity(item) === 'Legendary') || pool[0];
  if (lootbox?.rarity === 'epico') return pool.find((item) => ['Epic', 'Legendary'].includes(getRarity(item))) || pool[0];
  if (lootbox?.rarity === 'raro') return pool.find((item) => ['Rare', 'Epic', 'Legendary'].includes(getRarity(item))) || pool[0];
  return pool[0];
}

function applyCouponCode(inputCode = '') {
  if (!isAuthenticated()) {
    els.profileCouponStatus.textContent = 'Entre em uma conta local para aplicar cupons.';
    showToast('Entre para aplicar cupons.', 'warn');
    return;
  }
  const code = String(inputCode || els.profileCouponInput.value || '').trim().toUpperCase();
  if (!code) {
    els.profileCouponStatus.textContent = 'Digite um codigo para aplicar.';
    return;
  }
  const coupon = adminOperationsConfig.coupons.find((entry) => String(entry.code || '').toUpperCase() === code);
  if (!coupon || coupon.status !== 'ativo') {
    els.profileCouponStatus.textContent = 'Cupom nao encontrado ou indisponivel.';
    showToast('Cupom indisponivel.', 'warn');
    return;
  }
  if (redeemedCouponsState.includes(code)) {
    els.profileCouponStatus.textContent = 'Este cupom ja foi usado nesta conta.';
    showToast('Cupom ja utilizado nesta conta.', 'warn');
    return;
  }
  if (Number(coupon.limit || 0) > 0 && Number(coupon.used || 0) >= Number(coupon.limit || 0)) {
    els.profileCouponStatus.textContent = 'Este cupom esgotou o limite local.';
    showToast('Limite do cupom atingido.', 'warn');
    return;
  }
  if (Number(coupon.rewardPoints || 0) > 0) walletState.pointBalance = Number(walletState.pointBalance || 0) + Number(coupon.rewardPoints || 0);
  if (Number(coupon.discountValue || 0) > 0) walletState.cashBalance = Number(walletState.cashBalance || 0) + Number(coupon.discountValue || 0);
  saveWalletState();
  redeemedCouponsState.unshift(code);
  redeemedCouponsState = [...new Set(redeemedCouponsState)].slice(0, 30);
  saveRedeemedCouponsState();
  coupon.used = Number(coupon.used || 0) + 1;
  saveAdminOperationsConfig();
  appendHistoryEntry({
    kind: 'Cupom',
    itemName: code,
    date: new Date().toLocaleString('pt-BR'),
    copy: `${formatNumber(coupon.rewardPoints || 0)} pontos e ${formatNumber(coupon.discountValue || 0)} de saldo aplicados na conta.`,
  });
  appendAdminAudit(`Cupom ${code} aplicado por ${userDisplayName()}.`, 'Cupom');
  if (els.profileCouponInput) els.profileCouponInput.value = '';
  els.profileCouponStatus.textContent = `Cupom ${code} aplicado com sucesso.`;
  showToast(`Cupom ${code} aplicado.`, 'success');
  render();
}

function openLootbox(lootboxId, mode) {
  if (!isAuthenticated()) return;
  const entry = adminOperationsConfig.lootboxes.find((lootbox) => lootbox.id === lootboxId && lootbox.status === 'ativa');
  if (!entry) {
    showToast('Loot box indisponivel.', 'warn');
    return;
  }
  const rewardItem = pickLootboxReward(entry);
  if (!rewardItem) {
    showToast('Nenhum item disponivel para esta loot box.', 'warn');
    return;
  }
  if (mode === 'cash') {
    const amount = Number(entry.costCash || 0);
    if (!amount || amount > Number(walletState.cashBalance || 0)) {
      showToast('Saldo real insuficiente para abrir a loot box.', 'warn');
      return;
    }
    walletState.cashBalance = Math.max(0, Number(walletState.cashBalance || 0) - amount);
  } else {
    const amount = Number(entry.costPoints || 0);
    if (!amount || amount > getEffectivePointBalance()) {
      showToast('Pontos insuficientes para abrir a loot box.', 'warn');
      return;
    }
    walletState.pointBalance = Math.max(0, Number(walletState.pointBalance || 0) - amount);
  }
  saveWalletState();
  addInventoryItem(rewardItem, `Loot Box ${entry.name}`);
  appendHistoryEntry({
    kind: 'Loot Box',
    itemName: rewardItem.name,
    date: new Date().toLocaleString('pt-BR'),
    copy: `${entry.name} aberta com ${mode === 'cash' ? 'saldo real' : 'pontos'} e drop ${rewardItem.name}.`,
  });
  appendAdminOrderFromAction(rewardItem, mode, 'entregue', `Loot box ${entry.name} aberta por ${userDisplayName()}.`);
  appendAdminAudit(`Loot box ${entry.name} aberta por ${userDisplayName()} com drop ${rewardItem.name}.`, 'Loot box');
  showToast(`Loot box aberta: ${rewardItem.name}`, 'success');
  render();
}

function renderCraftingPage() {
  const query = normalizeText(state.craftingQuery);
  const filteredSources = craftingSourceCatalog.filter(({ item, targets }) => {
    const haystack = normalizeText(
      `${item.name} ${item.nameEn} ${item.type} ${item.description} ${targets.map((target) => target.label).join(' ')}`,
    );
    return !query || haystack.includes(query);
  });
  const filteredCraftables = craftableCatalog.filter(({ item, sources }) => {
    const haystack = normalizeText(
      `${item.name} ${item.nameEn} ${item.type} ${item.description} ${sources.map((source) => source.name).join(' ')}`,
    );
    return !query || haystack.includes(query);
  });

  els.craftingCraftableCount.textContent = formatNumber(craftableCatalog.length);
  els.craftingSourceCount.textContent = formatNumber(craftingSourceCatalog.length);
  els.craftingRecipeCount.textContent = formatNumber(
    craftingSourceCatalog.reduce((total, source) => total + source.targets.length, 0),
  );
  els.craftingSourceLabel.textContent = `${filteredSources.length} entradas`;
  els.craftingOutputLabel.textContent = `${filteredCraftables.length} entradas`;

  const sourceCards = filteredSources.slice(0, 60).map(({ item, targets }) => {
    const card = document.createElement('article');
    card.className = 'utility-card';
    card.tabIndex = 0;
    card.innerHTML = `
      <small>${getType(item)}</small>
      <strong>${item.name}</strong>
      <p>${targets.length} saidas encontradas no dataset.</p>
      <div class="utility-chip-row"></div>
    `;
    const chipRow = card.querySelector('.utility-chip-row');
    targets.slice(0, 6).forEach((target) => chipRow.appendChild(createUtilityChip(target.label, target.item)));
    card.addEventListener('click', () => openItemModal(item));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openItemModal(item);
      }
    });
    return card;
  });

  const craftableCards = filteredCraftables.slice(0, 60).map(({ item, sources }) => {
    const card = document.createElement('article');
    card.className = 'utility-card';
    card.tabIndex = 0;
    card.innerHTML = `
      <small>${getType(item)} // ${rarityLabels[getRarity(item)]}</small>
      <strong>${item.name}</strong>
      <p>${sources.length ? `Ligado a ${sources.length} material(is) no dataset.` : 'Sem receita explicita no texto do dataset.'}</p>
      <div class="utility-chip-row"></div>
    `;
    const chipRow = card.querySelector('.utility-chip-row');
    if (sources.length) {
      sources.slice(0, 5).forEach((source) => chipRow.appendChild(createUtilityChip(source.name, source)));
    } else {
      chipRow.appendChild(createUtilityChip(item.isBlueprint ? 'Blueprint' : 'Craftavel'));
    }
    card.addEventListener('click', () => openItemModal(item));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openItemModal(item);
      }
    });
    return card;
  });

  els.craftingSourceGrid.replaceChildren(
    ...(sourceCards.length ? sourceCards : [createUtilityEmptyCard('Nenhum material encontrado', 'Ajuste a busca para ver mais receitas.')]),
  );
  els.craftingOutputGrid.replaceChildren(
    ...(craftableCards.length ? craftableCards : [createUtilityEmptyCard('Nenhum craftavel encontrado', 'A busca atual nao combinou com itens craftaveis.')]),
  );
}

function renderRecyclingPage() {
  const query = normalizeText(state.recyclingQuery);
  const filtered = recyclingCatalog.filter(({ item, outputs }) => {
    const haystack = normalizeText(`${item.name} ${item.nameEn} ${item.type} ${item.description} ${outputs.join(' ')}`);
    return !query || haystack.includes(query);
  });

  els.recyclingItemCount.textContent = formatNumber(recyclingCatalog.length);
  els.recyclingKnownCount.textContent = formatNumber(recyclingCatalog.filter((entry) => entry.outputs.length).length);
  els.recyclingValueCount.textContent = formatNumber(
    recyclingCatalog.reduce((total, entry) => total + Number(entry.item.value || 0), 0),
  );
  els.recyclingResultLabel.textContent = `${filtered.length} entradas`;

  const cards = filtered.slice(0, 80).map(({ item, outputs }) => {
    const card = document.createElement('article');
    card.className = 'utility-card';
    card.tabIndex = 0;
    card.innerHTML = `
      <small>${getType(item)} // valor ${formatNumber(item.value)}</small>
      <strong>${item.name}</strong>
      <p>${outputs.length ? `Retorno descrito: ${outputs.join(', ')}.` : 'O dataset marca o item como reciclavel, mas sem saida especifica no texto.'}</p>
      <div class="utility-chip-row"></div>
    `;
    const chipRow = card.querySelector('.utility-chip-row');
    if (outputs.length) {
      outputs.slice(0, 5).forEach((output) => chipRow.appendChild(createUtilityChip(output, resolveItemNameReference(output))));
    } else {
      chipRow.appendChild(createUtilityChip('Reciclavel'));
    }
    card.addEventListener('click', () => openItemModal(item));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openItemModal(item);
      }
    });
    return card;
  });

  els.recyclingGrid.replaceChildren(
    ...(cards.length ? cards : [createUtilityEmptyCard('Nenhum item encontrado', 'Ajuste a busca para ver outras fontes reciclaveis.')]),
  );
}

function renderTradeTraderFilters() {
  const counts = new Map();
  data.trades.forEach((entry) => {
    counts.set(entry.trader, (counts.get(entry.trader) || 0) + 1);
  });

  const buttons = [
    { id: 'all', label: 'Todos', count: data.trades.length },
    ...traderCatalog.map((trader) => ({ id: trader, label: trader, count: counts.get(trader) || 0 })),
  ].map((entry) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `trade-filter ${state.tradeTrader === entry.id ? 'active' : ''}`;
    button.innerHTML = `<span>${entry.label}</span><small>${entry.count}</small>`;
    button.addEventListener('click', () => {
      state.tradeTrader = entry.id;
      renderTradesPage();
    });
    return button;
  });

  els.tradeTraderFilters.replaceChildren(...buttons);
}

function buildTradeCard(entry) {
  const rewardItem = findItemById(entry.itemId);
  const costItem = findItemById(entry.cost?.itemId);
  const visibility = rewardItem ? itemVisibilityFor(rewardItem) : 'publicado';
  const stockValue = rewardItem ? itemStockFor(rewardItem) : null;
  const threshold = rewardItem ? itemThresholdFor(rewardItem) : 0;
  const lowStock = stockValue !== null && stockValue <= threshold && stockValue > 0;
  const outOfStock = stockValue !== null && stockValue <= 0;
  const highlighted = rewardItem ? Boolean(getAdminProductRecord(rewardItem.id)?.highlight) : false;
  const card = document.createElement('article');
  card.className = 'utility-card trade-card';
  card.tabIndex = 0;
  const availabilityLine = outOfStock
    ? 'Marketplace local sem estoque no momento.'
    : lowStock
      ? 'Estoque baixo monitorado pelo admin.'
      : visibility === 'limitado'
        ? 'Oferta limitada no marketplace local.'
        : '';
  card.innerHTML = `
    <small>${entry.trader} // ${rewardItem ? getType(rewardItem) : 'Item'}</small>
    <strong>${rewardItem?.name || itemNameForId(entry.itemId)}</strong>
    <p>${entry.cost?.quantity ? `Custa ${formatNumber(entry.cost.quantity)} ${costItem?.name || itemNameForId(entry.cost?.itemId)}.` : 'Sem custo mapeado.'}${entry.requiredLevel ? ` Nivel ${entry.requiredLevel}.` : ''}${entry.dailyLimit ? ` Limite ${entry.dailyLimit}/dia.` : ''}</p>
    ${availabilityLine ? `<p class="trade-market-line${outOfStock ? ' soldout' : lowStock || visibility === 'limitado' ? ' warning' : ''}">${availabilityLine}</p>` : ''}
    <div class="utility-chip-row">
      <span class="utility-chip">${entry.quantity ? `${formatNumber(entry.quantity)}x retorno` : 'Retorno 1x'}</span>
      <span class="utility-chip">${stockValue === null ? 'Estoque livre' : `${formatNumber(stockValue)} em estoque`}</span>
      ${highlighted ? '<span class="utility-chip">Destaque</span>' : ''}
      ${visibility === 'limitado' ? '<span class="utility-chip">Limitado</span>' : ''}
    </div>
  `;
  const actionRow = document.createElement('div');
  actionRow.className = 'admin-user-row-actions';
  const rewardButton = document.createElement('button');
  rewardButton.type = 'button';
  rewardButton.textContent = 'Ver item';
  rewardButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (rewardItem) openItemModal(rewardItem);
  });
  actionRow.appendChild(rewardButton);
  if (costItem) {
    const costButton = document.createElement('button');
    costButton.type = 'button';
    costButton.textContent = 'Ver custo';
    costButton.addEventListener('click', (event) => {
      event.stopPropagation();
      openItemModal(costItem);
    });
    actionRow.appendChild(costButton);
  }
  card.appendChild(actionRow);
  card.addEventListener('click', () => {
    if (rewardItem) openItemModal(rewardItem);
  });
  card.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && rewardItem) {
      event.preventDefault();
      openItemModal(rewardItem);
    }
  });
  return card;
}

function renderTradesPage() {
  renderTradeTraderFilters();
  const query = normalizeText(state.tradeQuery);
  const filtered = data.trades.filter((entry) => {
    if (state.tradeTrader !== 'all' && entry.trader !== state.tradeTrader) return false;
    const rewardItem = findItemById(entry.itemId);
    const costItem = findItemById(entry.cost?.itemId);
    const haystack = normalizeText(
      `${entry.trader} ${rewardItem?.name || entry.itemId} ${costItem?.name || entry.cost?.itemId || ''} ${rewardItem?.type || ''}`,
    );
    return !query || haystack.includes(query);
  });

  els.tradeOfferCount.textContent = formatNumber(data.trades.length);
  els.tradeTraderCount.textContent = formatNumber(traderCatalog.length);
  els.tradeVisibleCount.textContent = formatNumber(filtered.length);
  els.tradeResultLabel.textContent = `${filtered.length} entradas`;
  const cards = filtered.slice(0, 90).map((entry) => buildTradeCard(entry));

  els.tradeGrid.replaceChildren(
    ...(cards.length ? cards : [createUtilityEmptyCard('Nenhuma oferta encontrada', 'Ajuste a busca ou troque o trader selecionado.')]),
  );
}

function toggleDailyTask(taskId) {
  dailyTaskState.completed[taskId] = !dailyTaskState.completed[taskId];
  saveDailyTaskState();
  renderHomeDashboard();
}

function createDashboardCard(kicker, title, copy, route, chips = []) {
  const card = document.createElement('article');
  card.className = 'dashboard-card';
  card.tabIndex = 0;
  card.innerHTML = `
    <small>${kicker}</small>
    <strong>${title}</strong>
    <p>${copy}</p>
    <div class="utility-chip-row"></div>
  `;
  const chipRow = card.querySelector('.utility-chip-row');
  chips.forEach((chip) => chipRow.appendChild(createUtilityChip(chip.label, chip.item || null)));
  card.addEventListener('click', () => setRoute(route));
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setRoute(route);
    }
  });
  return card;
}

function renderHomeDashboard() {
  ensureCurrentDailyTaskState();
  const tasks = getDailyTasks();
  const completedCount = tasks.filter((task) => dailyTaskState.completed[task.id]).length;
  const rewardPoints = getDailyRewardPoints();

  els.dailyResetLabel.textContent = `${dailyTaskState.date} // reset diario`;
  els.dailyDoneCount.textContent = `${completedCount}/${tasks.length}`;
  els.rewardPointCount.textContent = formatNumber(rewardPoints);
  els.rewardBonusLabel.textContent =
    completedCount === tasks.length ? 'Caixa premium' : completedCount >= 2 ? 'Bonus parcial' : 'Em preparo';

  const taskCards = tasks.map((task) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `task-card ${dailyTaskState.completed[task.id] ? 'done' : ''}`;
    button.innerHTML = `
      <span>${task.points} pts</span>
      <strong>${task.title}</strong>
      <p>${task.hint}</p>
    `;
    button.addEventListener('click', () => toggleDailyTask(task.id));
    return button;
  });
  els.dailyTaskList.replaceChildren(...taskCards);

  const marketCards = getFeaturedTrades()
    .map((entry) =>
      createDashboardCard(
        entry.trader,
        itemNameForId(entry.itemId),
        `Custa ${formatNumber(entry.cost?.quantity || 0)} ${itemNameForId(entry.cost?.itemId)}${entry.requiredLevel ? ` // nivel ${entry.requiredLevel}` : ''}.`,
        'trades',
        [
          { label: `Saida ${formatNumber(entry.quantity || 1)}` },
          entry.dailyLimit ? { label: `Limite ${entry.dailyLimit}/dia` } : { label: 'Sem limite' },
        ],
      ),
    );
  els.marketSpotlightGrid.replaceChildren(
    ...(marketCards.length ? marketCards : [createUtilityEmptyCard('Sem ofertas em destaque', 'Adicione ou revise trades do pacote offline.')]),
  );

  const lootCards = getFeaturedItems()
    .map((item) =>
      createDashboardCard(
        getType(item),
        item.name,
        `${rarityLabels[getRarity(item)]} // valor/kg ${formatNumber(Math.round(valuePerKgFor(item)))}`,
        'items',
        [
          { label: `Base ${formatNumber(item.value)}` },
          { label: `Peso ${item.weightKg ? formatNumber(item.weightKg) : 'N/D'} kg` },
        ],
      ),
    );
  els.lootSpotlightGrid.replaceChildren(
    ...(lootCards.length ? lootCards : [createUtilityEmptyCard('Sem itens em destaque', 'O dataset local ainda nao trouxe itens suficientes para o spotlight.')]),
  );

  const intelCards = getFeaturedMaps()
    .map((map) =>
      createDashboardCard(
        map.label || 'ARC region',
        map.name,
        map.description,
        'maps',
        [{ label: 'Rotas e pings' }, { label: 'Intel tatico' }],
      ),
    );
  els.intelSpotlightGrid.replaceChildren(
    ...(intelCards.length ? intelCards : [createUtilityEmptyCard('Sem intel recomendada', 'Carregue imagens locais para completar o spotlight de mapas.')]),
  );
}

function renderStats() {
  els.statItems.textContent = formatNumber(data.items.length);
  els.statBots.textContent = formatNumber(data.bots.length);
  els.statMaps.textContent = formatNumber(data.maps.length);
  els.statTrades.textContent = formatNumber(data.trades.length);
}

function render() {
  renderAuthUI();
  renderHomeDashboard();
  renderProfilePage();
  renderAdminPage();
  renderRarityFilters();
  renderTypeFilters();
  renderItems();
  renderCraftingPage();
  renderRecyclingPage();
  renderTradesPage();
}

els.searchInput.addEventListener('input', (event) => {
  state.query = event.target.value;
  renderItems();
});

els.craftingSearchInput.addEventListener('input', (event) => {
  state.craftingQuery = event.target.value;
  renderCraftingPage();
});

els.recyclingSearchInput.addEventListener('input', (event) => {
  state.recyclingQuery = event.target.value;
  renderRecyclingPage();
});

els.tradeSearchInput.addEventListener('input', (event) => {
  state.tradeQuery = event.target.value;
  renderTradesPage();
});

if (els.adminSearchInput) {
  els.adminSearchInput.addEventListener('input', (event) => {
    state.adminQuery = event.target.value;
    renderAdminPage();
  });
}

adminSectionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.adminSection = button.dataset.adminSection || 'dashboard';
    resetAdminWorkspaceEditor();
    renderAdminPage();
  });
});

adminNavGroups.forEach((group) => {
  group.addEventListener('toggle', () => {
    if (group.querySelector(`[data-admin-section="${state.adminSection}"]`) && !group.open) {
      group.open = true;
      return;
    }
    saveAdminUiState();
  });
});

els.adminUserModalClose?.addEventListener('click', closeAdminUserModal);
els.adminUserModal?.addEventListener('click', (event) => {
  if (event.target === els.adminUserModal) closeAdminUserModal();
});
els.adminUserForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const inputName = els.adminUserNameInput.value.trim();
  const inputEmail = els.adminUserEmailInput.value.trim().toLowerCase();
  const inputPassword = els.adminUserPasswordInput.value.trim();
  const inputRole = els.adminUserRoleInput.value === 'admin' ? 'admin' : 'user';

  if (!inputName || !inputEmail) {
    els.adminUserModalStatus.textContent = 'Preencha nome e e-mail para continuar.';
    return;
  }

  if (adminUserModalMode === 'create') {
    if (!inputPassword) {
      els.adminUserModalStatus.textContent = 'Informe uma senha local para a nova conta.';
      return;
    }
    if (authUsers[inputEmail]) {
      els.adminUserModalStatus.textContent = 'Ja existe uma conta com esse e-mail.';
      return;
    }
    authUsers[inputEmail] = {
      name: inputName,
      email: inputEmail,
      password: inputPassword,
      role: inputRole,
      createdAt: new Date().toISOString(),
    };
    saveAuthUsers();
    saveWalletStateFor(inputEmail, {
      cashBalance: Number(els.adminUserCashInput.value || 0),
      pointBalance: Number(els.adminUserPointsInput.value || 0),
    });
    appendAdminAudit(`Conta ${inputName} criada com cargo ${inputRole}.`, 'Usuario');
    els.adminUserModalStatus.textContent = 'Conta criada com sucesso.';
    showToast(`Conta ${inputName} criada.`, 'success');
    closeAdminUserModal();
    render();
    return;
  }

  const email = adminEditingUserEmail;
  const target = authUsers[email];
  if (!target) return;

  target.name = inputName || target.name;
  if (inputPassword) target.password = inputPassword;
  if (target.email !== defaultAdminEmail) {
    target.role = inputRole;
  }
  saveAuthUsers();
  saveWalletStateFor(email, {
    cashBalance: Number(els.adminUserCashInput.value || 0),
    pointBalance: Number(els.adminUserPointsInput.value || 0),
  });
  appendAdminAudit(`Conta ${target.name} atualizada com novo saldo e cargo ${target.role}.`, 'Usuario');
  els.adminUserModalStatus.textContent = 'Usuario atualizado com sucesso.';
  showToast(`Usuario ${target.name} atualizado.`, 'success');
  render();
  if (currentSession.email === email && target.role !== 'admin') renderRoute();
});
els.adminClearHistoryButton?.addEventListener('click', () => {
  const email = adminEditingUserEmail;
  const target = authUsers[email];
  if (!target) return;
  clearUserHistory(email);
  appendAdminAudit(`Historico de ${target.name} foi limpo pelo modal admin.`, 'Historico');
  els.adminUserModalStatus.textContent = 'Historico removido do usuario.';
  showToast(`Historico de ${target.name} limpo.`, 'success');
  render();
  syncAdminUserModal();
});
els.adminClearInventoryButton?.addEventListener('click', () => {
  const email = adminEditingUserEmail;
  const target = authUsers[email];
  if (!target) return;
  clearUserInventory(email);
  appendAdminAudit(`Inventario de ${target.name} foi limpo pelo modal admin.`, 'Inventario');
  els.adminUserModalStatus.textContent = 'Inventario removido do usuario.';
  showToast(`Inventario de ${target.name} limpo.`, 'success');
  render();
  syncAdminUserModal();
});
els.adminDeleteUserButton?.addEventListener('click', () => {
  const email = adminEditingUserEmail;
  const target = authUsers[email];
  if (!target || target.email === defaultAdminEmail) return;
  removeUserAccount(email);
  appendAdminAudit(`Conta ${target.name} removida do pacote local.`, 'Usuario');
  showToast(`Conta ${target.name} excluida.`, 'success');
  closeAdminUserModal();
  render();
  renderRoute();
});
els.adminCreateUserButton?.addEventListener('click', openAdminCreateUserModal);
els.adminResetOpsButton?.addEventListener('click', () => {
  adminOperationsConfig = buildDefaultAdminOperationsConfig();
  saveAdminOperationsConfig();
  resetAdminWorkspaceEditor();
  appendAdminAudit('Modulos operacionais do admin restaurados para o padrao.', 'Admin');
  showToast('Modulos do admin restaurados.', 'success');
  render();
});
els.adminExportButton?.addEventListener('click', () => {
  const payload = {
    exportedAt: new Date().toISOString(),
    section: state.adminSection,
    users: buildAdminDataset().users,
    adminContentConfig,
    adminOperationsConfig,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sucatao-admin-${state.adminSection}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  appendAdminAudit(`Relatorio do modulo ${state.adminSection} exportado.`, 'Admin');
  showToast('Relatorio exportado.', 'success');
});
els.adminContentForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  adminContentConfig = {
    dailyTasks: adminTaskTitleInputs.map((input, index) => ({
      id: getDailyTasks()[index]?.id || `custom-task-${index + 1}`,
      title: input.value.trim() || `Tarefa ${index + 1}`,
      points: Number(adminTaskPointsInputs[index]?.value || 0),
      hint: adminTaskHintInputs[index]?.value.trim() || 'Sem dica cadastrada.',
    })),
    featuredTradeKeys: adminFeaturedTradeInputs.map((select) => select?.value).filter(Boolean),
    featuredItemIds: adminFeaturedItemInputs.map((select) => select?.value).filter(Boolean),
    featuredMapIds: adminFeaturedMapInputs.map((select) => select?.value).filter(Boolean),
  };
  saveAdminContentConfig();
  appendAdminAudit('Curadoria da home e tarefas diarias atualizada.', 'Home');
  els.adminContentStatus.textContent = 'Curadoria salva com sucesso.';
  showToast('Home e tarefas atualizadas.', 'success');
  render();
});
els.adminContentResetButton?.addEventListener('click', () => {
  adminContentConfig = buildDefaultAdminContentConfig();
  saveAdminContentConfig();
  syncAdminContentForm();
  appendAdminAudit('Curadoria da home restaurada para o padrao.', 'Home');
  els.adminContentStatus.textContent = 'Configuracao padrao restaurada.';
  showToast('Curadoria restaurada.', 'success');
  render();
});

els.arcSearchInput.addEventListener('input', (event) => {
  state.arcQuery = event.target.value;
  renderArcDatabase();
});

els.sortSelect.addEventListener('change', (event) => {
  state.sort = event.target.value;
  renderItems();
});

els.favoriteToggleButton.addEventListener('click', () => {
  state.favoritesOnly = !state.favoritesOnly;
  renderItems();
});

els.resetButton.addEventListener('click', () => {
  state.query = '';
  state.rarity = 'all';
  state.type = 'all';
  state.sort = 'value-desc';
  state.favoritesOnly = false;
  els.searchInput.value = '';
  els.sortSelect.value = state.sort;
  render();
});

els.authActionButton.addEventListener('click', () => {
  if (isAuthenticated()) {
    setRoute('profile');
    return;
  }
  openAuthModal('login');
});
els.logoutButton.addEventListener('click', logoutUser);
els.profileLoginButton.addEventListener('click', () => openAuthModal('login'));
els.profileLogoutButton.addEventListener('click', logoutUser);
els.profileCouponButton?.addEventListener('click', applyCouponCode);
els.profileCouponInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    applyCouponCode();
  }
});
els.profileSupportForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!isAuthenticated()) {
    els.profileSupportStatus.textContent = 'Entre para abrir suporte local.';
    showToast('Entre para abrir ticket.', 'warn');
    return;
  }
  const subject = String(els.profileSupportSubject?.value || '').trim();
  const priority = String(els.profileSupportPriority?.value || 'media').trim();
  const note = String(els.profileSupportNote?.value || '').trim();
  const supportContext = state.profileSupportContext || null;
  if (!subject) {
    els.profileSupportStatus.textContent = 'Informe um assunto para abrir o ticket.';
    return;
  }
  const timestamp = new Date().toISOString();
  const ticket = {
    id: createAdminEntryId('ticket'),
    subject,
    userName: userDisplayName(),
    userEmail: currentSession.email,
    ownerEmail: currentSession.email,
    relatedItemId: supportContext?.itemId || '',
    relatedOrderId: supportContext?.orderId || '',
    priority,
    status: 'aberto',
    channel: 'site',
    owner: 'Equipe Ops',
    note,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  adminOperationsConfig.tickets = [ticket, ...adminOperationsConfig.tickets].slice(0, 60);
  saveAdminOperationsConfig();
  appendHistoryEntry({
    kind: 'Suporte',
    itemName: subject,
    date: new Date(timestamp).toLocaleString('pt-BR'),
    copy: `Ticket aberto com prioridade ${priority}.${supportContext?.orderId ? ` Pedido ${supportContext.orderId}.` : ''}${supportContext?.itemId ? ` Item ${itemNameForId(supportContext.itemId)}.` : ''} ${note || 'Aguardando triagem da equipe ops.'}`,
  });
  appendAdminAudit(`Ticket ${subject} aberto por ${userDisplayName()}.`, 'Suporte');
  els.profileSupportForm.reset();
  els.profileSupportPriority.value = 'media';
  clearProfileSupportContext();
  els.profileSupportStatus.textContent = `Ticket ${subject} aberto com sucesso.`;
  showToast(`Ticket aberto: ${subject}`, 'success');
  render();
});
els.authModalClose.addEventListener('click', closeAuthModal);
els.authModal.addEventListener('click', (event) => {
  if (event.target === els.authModal) closeAuthModal();
});
els.authModeLoginButton.addEventListener('click', () => {
  authMode = 'login';
  syncAuthModal();
});
els.authModeRegisterButton.addEventListener('click', () => {
  authMode = 'register';
  syncAuthModal();
});
els.authForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = els.authNameInput.value.trim();
  const email = els.authEmailInput.value.trim().toLowerCase();
  const password = els.authPasswordInput.value.trim();

  if (!email || !password) {
    els.authStatusMessage.textContent = 'Preencha e-mail e senha para continuar.';
    return;
  }

  if (authMode === 'register') {
    if (!name) {
      els.authStatusMessage.textContent = 'Informe um nome para criar a conta.';
      return;
    }
    if (authUsers[email]) {
      els.authStatusMessage.textContent = 'Ja existe uma conta local com esse e-mail.';
      return;
    }
    createUserAccount(name, email, password);
    els.authStatusMessage.textContent = 'Conta criada. Sessao iniciada localmente.';
  } else {
    const user = authUsers[email];
    if (!user || user.password !== password) {
      els.authStatusMessage.textContent = 'E-mail ou senha invalidos neste navegador.';
      return;
    }
    loginUser(email);
    els.authStatusMessage.textContent = 'Login realizado com sucesso.';
  }

  els.authForm.reset();
  render();
  renderRoute();
  closeAuthModal();
});

els.mapSearchInput.addEventListener('input', (event) => {
  state.mapQuery = event.target.value;
  state.mapPreset = 'custom';
  state.selectedMarkerId = '';
  state.selectedRouteId = '';
  renderMapsPage();
});
els.showMarkersInput.addEventListener('change', (event) => {
  state.showMarkers = event.target.checked;
  state.mapPreset = 'custom';
  state.selectedMarkerId = '';
  renderMapsPage();
});
els.showRoutesInput.addEventListener('change', (event) => {
  state.showRoutes = event.target.checked;
  state.mapPreset = 'custom';
  state.selectedRouteId = '';
  renderMapsPage();
});
els.sourceFilterSelect.addEventListener('change', (event) => {
  state.sourceFilter = event.target.value;
  state.mapPreset = 'custom';
  state.selectedMarkerId = '';
  state.selectedRouteId = '';
  renderMapsPage();
});
els.clearMapFiltersButton.addEventListener('click', () => {
  resetMapFilters();
  renderMapsPage();
});
els.mapFilterDropdown.addEventListener('toggle', positionMapFilterMenu);
window.addEventListener('resize', positionMapFilterMenu);

els.addMarkerButton.addEventListener('click', () => {
  state.isAddingMarker = true;
  state.isAddingRoute = false;
  state.selectedMarkerId = '';
  state.selectedRouteId = '';
  renderMapsPage();
});
els.addRouteButton.addEventListener('click', () => {
  state.isAddingRoute = true;
  state.isAddingMarker = false;
  state.selectedMarkerId = '';
  state.selectedRouteId = '';
  state.draftRoutePoints = [];
  renderMapsPage();
});
els.finishRouteButton.addEventListener('click', openRouteModal);

els.cancelMarkerButton.addEventListener('click', cancelMarkerAddMode);
els.restoreMarkersButton.addEventListener('click', restoreHiddenMarkers);
els.exportMarkersButton.addEventListener('click', exportCustomMarkers);
els.importMarkersButton.addEventListener('click', openImportModal);
els.saveMarkersButton.addEventListener('click', saveMarkersToPackage);
els.zoomOutButton.addEventListener('click', () => setMapZoom(state.mapZoom - 0.2));
els.zoomResetButton.addEventListener('click', () => setMapZoom(1));
els.zoomInButton.addEventListener('click', () => setMapZoom(state.mapZoom + 0.2));

els.markerModalClose.addEventListener('click', cancelMarkerAddMode);
els.markerModal.addEventListener('click', (event) => {
  if (event.target === els.markerModal) cancelMarkerAddMode();
});
els.markerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  saveDraftMarker();
});
els.routeModalClose.addEventListener('click', cancelMarkerAddMode);
els.routeModal.addEventListener('click', (event) => {
  if (event.target === els.routeModal) cancelMarkerAddMode();
});
els.routeForm.addEventListener('submit', (event) => {
  event.preventDefault();
  saveDraftRoute();
});
els.importModalClose.addEventListener('click', closeImportModal);
els.importModal.addEventListener('click', (event) => {
  if (event.target === els.importModal) closeImportModal();
});
els.importForm.addEventListener('submit', (event) => {
  event.preventDefault();
  importCustomMarkers();
});

els.modalClose.addEventListener('click', closeItemModal);
els.redeemPointsButton.addEventListener('click', () => transactItem('points'));
els.buyCashButton.addEventListener('click', () => transactItem('cash'));
els.itemModal.addEventListener('click', (event) => {
  if (event.target === els.itemModal) closeItemModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !els.itemModal.hidden) closeItemModal();
  if (event.key === 'Escape' && !els.adminUserModal.hidden) closeAdminUserModal();
  if (event.key === 'Escape' && !els.markerModal.hidden) cancelMarkerAddMode();
  if (event.key === 'Escape' && !els.routeModal.hidden) cancelMarkerAddMode();
  if (event.key === 'Escape' && !els.importModal.hidden) closeImportModal();
  if (event.key === 'Escape' && !els.authModal.hidden) closeAuthModal();
  if (event.key === 'Escape' && state.isAddingMarker) cancelMarkerAddMode();
  if (event.key === 'Escape' && state.isAddingRoute) cancelMarkerAddMode();
  if (event.key === 'Escape' && state.repositionMarkerId) cancelMarkerAddMode();
  if (event.key === 'Escape') {
    els.rarityDropdown.open = false;
    els.typeDropdown.open = false;
    els.mapFilterDropdown.open = false;
  }
});

document.addEventListener('click', (event) => {
  if (!els.rarityDropdown.contains(event.target)) els.rarityDropdown.open = false;
  if (!els.typeDropdown.contains(event.target)) els.typeDropdown.open = false;
  if (!els.mapFilterDropdown.contains(event.target)) els.mapFilterDropdown.open = false;
});
window.addEventListener('hashchange', renderRoute);
setupMarkerTypeOptions();
setupRouteTypeOptions();
renderStats();
renderIntel();
renderArcDatabase();
renderMapsPage();
renderRoute();
render();
