<template>
  <q-page class="workspace-page">
    <q-linear-progress v-if="loading" indeterminate />
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ error
      }}<template #action
        ><q-btn flat :label="t('common.retry')" @click="load" /></template
    ></q-banner>
    <template v-if="app">
      <header class="workspace-heading app-heading">
        <div class="app-heading-icon">
          <AppIcon
            :src="iconPreview || form.icon_url"
            :alt="t('workspace.iconAlt', { name: app.name })"
            fallback-icon="apps"
          />
        </div>
        <div class="app-heading-text">
          <span class="eyebrow">{{ t('workspace.eyebrow') }}</span>
          <h1>{{ form.name || app.name }}</h1>
          <div class="app-heading-meta">
            <q-chip
              dense
              :color="statusColor(app.status)"
              text-color="white"
              :label="statusLabel(app.status)"
            />
            <HostingBadge :source-type="app.source_type" />
          </div>
        </div>
        <div class="workspace-actions">
          <q-btn
            flat
            no-caps
            color="primary"
            icon="info"
            :label="t('publication.journey.help')"
            @click="helpOpen = true"
          />
          <q-btn
            v-if="app.status === 'published'"
            flat
            no-caps
            icon="storefront"
            :label="t('workspace.viewInStore')"
            :to="`/apps/${app.id}`"
          />
          <q-btn flat round icon="more_vert" :aria-label="t('workspace.more')">
            <q-menu auto-close>
              <q-list style="min-width: 200px">
                <q-item
                  v-if="app.status === 'archived'"
                  clickable
                  @click="restore"
                  ><q-item-section>{{
                    t('workspace.restore')
                  }}</q-item-section></q-item
                >
                <q-item v-else clickable @click="archive"
                  ><q-item-section class="text-negative">{{
                    t('workspace.archive')
                  }}</q-item-section></q-item
                >
                <q-item clickable :to="`/developer/stats`"
                  ><q-item-section>{{
                    t('workspace.stats')
                  }}</q-item-section></q-item
                >
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </header>

      <!-- What happens now, in one sentence each. -->
      <q-banner
        v-if="openRequest"
        class="state-banner state-info"
        role="status"
      >
        <template #avatar><q-icon name="hourglass_top" /></template>
        <strong>{{
          t(`workspace.banner.open.${openRequest.status}`, {
            date: formatDate(openRequest.submitted_at)
          })
        }}</strong>
        <p>{{ t('workspace.banner.openLocked') }}</p>
        <template #action>
          <q-btn
            flat
            no-caps
            :label="t('workspace.withdraw')"
            :loading="busy"
            @click="withdraw"
          />
        </template>
      </q-banner>
      <q-banner
        v-else-if="
          lastDecision &&
          ['changes_requested', 'rejected'].includes(lastDecision.status)
        "
        class="state-banner state-warning"
        role="alert"
      >
        <template #avatar><q-icon name="edit_note" /></template>
        <strong>{{ t(`workspace.banner.${lastDecision.status}`) }}</strong>
        <p class="decision-reason">{{ lastDecision.reason }}</p>
        <p class="text-caption">{{ t('workspace.banner.fixThenSubmit') }}</p>
      </q-banner>
      <q-banner
        v-if="hasPendingChanges && !openRequest"
        class="state-banner state-info"
      >
        <template #avatar><q-icon name="pending_actions" /></template>
        <strong>{{ t('workspace.banner.pending') }}</strong>
        <p>{{ t('workspace.banner.pendingHelp') }}</p>
        <template #action>
          <q-btn
            flat
            no-caps
            :label="t('workspace.discard')"
            :loading="busy"
            @click="discard"
          />
          <q-btn
            flat
            no-caps
            color="primary"
            :label="t('workspace.reviewAndSubmit')"
            @click="tab = 'submit'"
          />
        </template>
      </q-banner>
      <q-banner
        v-if="app.status === 'approved'"
        class="state-banner state-success"
      >
        <template #avatar><q-icon name="task_alt" /></template>
        <strong>{{ t('workspace.banner.approved') }}</strong>
        <p>{{ t('workspace.banner.approvedHelp') }}</p>
        <template #action>
          <q-btn
            color="positive"
            unelevated
            no-caps
            icon="rocket_launch"
            :label="t('workspace.publishNow')"
            :class="{ 'motion-launch': busy }"
            :disable="busy"
            @click="publish"
          />
        </template>
      </q-banner>
      <q-banner
        v-if="app.status === 'suspended' && app.moderation_reason"
        class="state-banner state-warning"
        role="alert"
      >
        <template #avatar><q-icon name="pause_circle" /></template>
        <strong>{{ t('workspace.banner.suspended') }}</strong>
        <p class="decision-reason">{{ app.moderation_reason }}</p>
      </q-banner>

      <q-dialog v-model="helpOpen" aria-labelledby="publication-help-title">
        <q-card class="help-card">
          <q-card-section class="row items-center no-wrap">
            <h2 id="publication-help-title" class="col help-title">{{
              t('publication.helpDialog.title')
            }}</h2>
            <q-btn
              flat
              round
              icon="close"
              :aria-label="t('common.close')"
              v-close-popup
            />
          </q-card-section>
          <q-card-section class="help-body">
            <p>{{ t('publication.helpDialog.intro') }}</p>
            <div
              v-for="(item, i) in tm('publication.helpDialog.steps')"
              :key="i"
              class="help-step"
            >
              <strong>{{ rt(item.title) }}</strong>
              <p>{{ rt(item.text) }}</p>
            </div>
            <p class="text-muted">{{ t('publication.helpDialog.footer') }}</p>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn
              unelevated
              no-caps
              color="primary"
              :label="t('common.gotIt')"
              v-close-popup
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-tabs
        v-model="tab"
        align="left"
        inline-label
        outside-arrows
        mobile-arrows
        no-caps
        class="workspace-tabs"
        active-color="primary"
        indicator-color="primary"
      >
        <q-tab
          v-for="item in tabs"
          :key="item.name"
          :name="item.name"
          :icon="item.icon"
          :label="t(`workspace.tab.${item.name}`)"
        >
          <q-badge
            v-if="tabGaps[item.name]"
            floating
            rounded
            color="orange"
            :label="tabGaps[item.name]"
            :aria-label="
              t(
                'workspace.missing',
                { n: tabGaps[item.name] },
                tabGaps[item.name]
              )
            "
          />
        </q-tab>
      </q-tabs>

      <q-tab-panels v-model="tab" animated keep-alive class="workspace-panels">
        <!-- 1. Informations -->
        <q-tab-panel name="info">
          <q-form class="workspace-form section-form" @submit="saveInfo">
            <fieldset :disabled="locked" class="plain-fieldset">
              <q-input
                v-model="form.name"
                outlined
                maxlength="255"
                :label="t('workspace.field.name')"
              />
              <q-input
                v-model="form.short_description"
                outlined
                maxlength="280"
                counter
                :label="t('workspace.field.shortDescription')"
                :hint="t('workspace.hint.shortDescription')"
              />
              <q-input
                v-model="form.description"
                outlined
                type="textarea"
                autogrow
                :label="t('workspace.field.description')"
                :hint="t('workspace.hint.description')"
                counter
              />
              <div class="form-row">
                <q-select
                  v-model="form.category_id"
                  outlined
                  emit-value
                  map-options
                  :options="categories"
                  option-value="id"
                  option-label="name"
                  :label="t('workspace.field.category')"
                />
                <q-input
                  v-model="form.subcategory"
                  outlined
                  maxlength="255"
                  :label="t('workspace.field.subcategory')"
                />
              </div>
              <q-select
                v-model="form.languages"
                outlined
                multiple
                use-chips
                emit-value
                map-options
                :options="languageOptions"
                :label="t('workspace.field.languages')"
                :hint="t('workspace.hint.languages')"
              />
              <fieldset class="checkbox-fieldset availability">
                <legend>{{ t('geo.title') }}</legend>
                <q-option-group
                  v-model="form.availability"
                  :options="[
                    { label: t('geo.all'), value: 'all' },
                    { label: t('geo.selected'), value: 'selected' }
                  ]"
                  type="radio"
                  inline
                />
                <template v-if="form.availability === 'selected'">
                  <p class="text-caption text-muted">{{ t('geo.choose') }}</p>
                  <CountrySelect
                    v-model="form.countries"
                    multiple
                    value-field="code"
                    :label="t('workspace.field.countries')"
                    class="full-width"
                  />
                  <p class="text-caption">{{
                    form.countries.length
                      ? t(
                          'geo.count',
                          { n: form.countries.length },
                          form.countries.length
                        )
                      : t('geo.none')
                  }}</p>
                </template>
              </fieldset>
              <div class="form-row">
                <q-input
                  v-model="form.official_site_url"
                  outlined
                  type="url"
                  :label="t('workspace.field.officialUrl')"
                  :hint="t('workspace.hint.officialUrl')"
                />
                <q-input
                  v-model="form.contact_email"
                  outlined
                  type="email"
                  :label="t('workspace.field.contactEmail')"
                  :hint="t('workspace.hint.contactEmail')"
                />
              </div>
              <div class="form-row">
                <q-input
                  v-model="form.support_url"
                  outlined
                  type="url"
                  :label="t('workspace.field.supportUrl')"
                />
                <q-input
                  v-model="form.terms_url"
                  outlined
                  type="url"
                  :label="t('workspace.field.termsUrl')"
                />
              </div>
              <fieldset class="checkbox-fieldset">
                <legend>{{ t('workspace.field.compatibility') }}</legend>
                <q-checkbox
                  v-for="option in COMPATIBILITY"
                  :key="option"
                  v-model="form.compatibility"
                  :val="option"
                  :label="t(`workspace.compatibility.${option}`)"
                  dense
                />
              </fieldset>
            </fieldset>
            <SaveBar :locked="locked" :busy="busy" :live="liveListing" />
          </q-form>
        </q-tab-panel>

        <!-- 2. Médias -->
        <q-tab-panel name="media">
          <q-form class="workspace-form section-form" @submit="saveMedia">
            <CoverUploader
              :cover="form.cover"
              :disable="locked"
              :busy="coverBusy"
              :progress="coverProgress"
              @upload="uploadCover"
              @remove="removeCover"
            />
            <fieldset :disabled="locked" class="plain-fieldset">
              <section class="media-block">
                <h3>{{ t('workspace.field.icon') }}</h3>
                <p class="text-caption text-muted">{{
                  t('workspace.hint.icon')
                }}</p>
                <div class="icon-row">
                  <div class="icon-preview">
                    <AppIcon
                      :src="iconPreview || form.icon_url"
                      :alt="t('workspace.iconAlt', { name: form.name })"
                      fallback-icon="image"
                    />
                  </div>
                  <q-file
                    v-model="iconFile"
                    outlined
                    dense
                    accept="image/png,image/jpeg,image/webp"
                    :label="t('workspace.chooseIcon')"
                    max-file-size="1048576"
                    @rejected="rejected"
                  >
                    <template #prepend><q-icon name="image" /></template>
                  </q-file>
                </div>
              </section>
              <section
                v-for="device in ['mobile', 'tablet']"
                :key="device"
                class="media-block"
              >
                <h3>{{ t(`workspace.screens.${device}`) }}</h3>
                <p class="text-caption text-muted">{{
                  t('workspace.hint.screens')
                }}</p>
                <div class="screens">
                  <figure
                    v-for="url in retained[device]"
                    :key="url"
                    class="screen-item"
                  >
                    <img :src="resolveMediaUrl(url)" alt="" loading="lazy" />
                    <q-btn
                      round
                      dense
                      size="sm"
                      color="negative"
                      icon="close"
                      class="screen-remove"
                      :aria-label="t('workspace.removeScreen')"
                      @click="removeScreen(device, url)"
                    />
                  </figure>
                  <figure
                    v-for="(file, i) in newScreens[device]"
                    :key="file.name + i"
                    class="screen-item screen-new"
                  >
                    <img :src="filePreview(file)" alt="" />
                    <q-btn
                      round
                      dense
                      size="sm"
                      icon="close"
                      class="screen-remove"
                      :aria-label="t('workspace.removeScreen')"
                      @click="newScreens[device].splice(i, 1)"
                    />
                  </figure>
                </div>
                <q-file
                  :model-value="null"
                  outlined
                  dense
                  multiple
                  append
                  accept="image/png,image/jpeg,image/webp"
                  max-file-size="5242880"
                  :label="t('workspace.addScreens')"
                  @update:model-value="files => addScreens(device, files)"
                  @rejected="rejected"
                >
                  <template #prepend
                    ><q-icon name="add_photo_alternate"
                  /></template>
                </q-file>
              </section>
            </fieldset>
            <SaveBar :locked="locked" :busy="busy" :live="liveListing" />
          </q-form>
        </q-tab-panel>

        <!-- 3. Confidentialité -->
        <q-tab-panel name="privacy">
          <q-form class="workspace-form section-form" @submit="savePrivacy">
            <fieldset :disabled="locked" class="plain-fieldset">
              <q-input
                v-model="form.privacy_policy_url"
                outlined
                type="url"
                :label="t('workspace.field.privacyUrl')"
                :hint="t('workspace.hint.privacyUrl')"
              />
              <fieldset class="checkbox-fieldset">
                <legend>{{ t('workspace.field.dataCollected') }}</legend>
                <p class="text-caption text-muted">{{
                  t('workspace.hint.dataCollected')
                }}</p>
                <q-checkbox
                  v-for="item in DATA_COLLECTED"
                  :key="item"
                  :model-value="form.data_collected.includes(item)"
                  :label="t(`workspace.data.${item}`)"
                  dense
                  @update:model-value="checked => toggleData(item, checked)"
                />
              </fieldset>
            </fieldset>
            <SaveBar :locked="locked" :busy="busy" :live="liveListing" />
          </q-form>
        </q-tab-panel>

        <!-- Contenu de l'application : accès pour la vérification, annonces, classification -->
        <q-tab-panel name="content">
          <AppContentPanel
            :key="app.updated_at"
            :app="app"
            :listing="{ ...app, ...app.pending_changes }"
            :disable="locked"
            :live="liveListing"
            @saved="load"
          />
        </q-tab-panel>

        <!-- 4. Version -->
        <q-tab-panel name="version">
          <section class="version-source">
            <h3>{{ t('workspace.source.title') }}</h3>
            <template v-if="sourceEditable">
              <q-option-group
                v-model="source.source_type"
                :options="[
                  { label: t('newApp.source.url'), value: 'url' },
                  {
                    label: zipAllowed
                      ? t('newApp.source.build')
                      : `${t('newApp.source.build')} — ${t('newApp.zipUnavailable')}`,
                    value: 'build',
                    disable: !zipAllowed
                  }
                ]"
                type="radio"
                inline
              />
              <div class="source-explain">
                <HostingBadge :source-type="source.source_type" />
                <span>{{ t(`newApp.sourceHelp.${source.source_type}`) }}</span>
              </div>
              <q-input
                v-if="source.source_type === 'url'"
                v-model="source.external_url"
                outlined
                type="url"
                :label="t('newApp.url')"
                :hint="t('newApp.urlHint')"
              />
              <q-btn
                v-if="sourceDirty"
                color="primary"
                unelevated
                no-caps
                :label="t('workspace.source.save')"
                :loading="busy"
                @click="saveSource"
              />
            </template>
            <p v-else class="text-muted">
              <HostingBadge :source-type="app.source_type" />
              {{ t('workspace.source.fixed') }}
            </p>
            <!-- Platform not ready to host builds: say it before the developer uploads. -->
            <q-banner
              v-if="
                app.source_type === 'build' &&
                platform &&
                !platform.build_hosting
              "
              class="workspace-alert"
              >{{ t('publication.source.hostingPending') }}</q-banner
            >
          </section>

          <section v-if="app.source_type === 'url'" class="version-url">
            <p class="url-line">
              <q-icon name="link" />
              <a
                v-if="safeExternalUrl(app.external_url)"
                :href="safeExternalUrl(app.external_url)"
                target="_blank"
                rel="noopener noreferrer"
                >{{ app.external_url }}</a
              ><span v-else>{{ app.external_url }}</span>
            </p>
            <q-btn
              outline
              no-caps
              color="primary"
              icon="fact_check"
              :label="t('workspace.source.check')"
              :loading="busy"
              :disable="locked"
              @click="checkUrl"
            />
            <p class="text-caption text-muted">{{
              t('workspace.source.checkAuto')
            }}</p>
            <q-list
              v-if="urlChecks.length"
              dense
              separator
              bordered
              class="rounded-borders q-mt-sm"
            >
              <q-item v-for="check in urlChecks.slice(0, 5)" :key="check.id">
                <q-item-section avatar>
                  <q-icon
                    :name="check.ok ? 'check_circle' : 'error'"
                    :color="check.ok ? 'positive' : 'negative'"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{
                    formatDate(check.created_at)
                  }}</q-item-label>
                  <q-item-label caption>{{
                    check.ok
                      ? check.manifest_found
                        ? t('publication.source.manifestFound')
                        : t('publication.source.manifestMissing')
                      : check.error
                  }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </section>
          <InstallMeasure
            v-if="app.source_type === 'url'"
            :app-id="app.id"
            :published="app.status === 'published'"
          />

          <section v-else class="version-build">
            <h3>{{ t('workspace.build.newVersion') }}</h3>
            <p class="text-caption text-muted">{{
              t('workspace.build.newVersionHelp')
            }}</p>
            <BuildUploader
              :app-id="app.id"
              :disable="locked"
              @uploaded="load"
            />
            <h3 class="q-mt-lg">{{ t('workspace.build.versions') }}</h3>
            <p v-if="!app.versions?.length" class="text-muted">{{
              t('publication.versions.empty')
            }}</p>
            <q-card
              v-for="v in app.versions"
              :key="v.id"
              flat
              bordered
              class="workspace-card version-card"
            >
              <div class="version-head">
                <h4>{{
                  t('publication.versions.version', {
                    number: v.version_number
                  })
                }}</h4>
                <q-chip
                  dense
                  :color="VERSION_COLORS[versionState(v)]"
                  text-color="white"
                  :label="t(`workspace.versionState.${versionState(v)}`)"
                />
              </div>
              <p v-if="v.release_notes" class="text-caption">{{
                v.release_notes
              }}</p>
              <template v-if="v.analysis_report?.dangerous_findings?.length">
                <p class="text-caption text-muted">{{
                  t('publication.versions.quarantineHint')
                }}</p>
                <ul class="analysis-list">
                  <li
                    v-for="item in v.analysis_report.dangerous_findings"
                    :key="item"
                    >{{ item }}</li
                  >
                </ul>
              </template>
              <p v-if="v.moderation_reason" class="decision-reason">{{
                v.moderation_reason
              }}</p>
              <ExternalResourcesReport :version="v" @changed="load" />
              <q-btn
                v-if="
                  v.moderation_status === 'approved' &&
                  v.status !== 'active' &&
                  app.status === 'published'
                "
                flat
                no-caps
                color="primary"
                icon="restore"
                :label="t('workspace.build.putOnline')"
                :loading="busy"
                @click="deploy(v)"
              />
            </q-card>
          </section>
        </q-tab-panel>

        <!-- 5. Récapitulatif et soumission -->
        <q-tab-panel name="submit">
          <div class="recap-grid">
            <q-card flat bordered class="workspace-card recap-preview">
              <span class="eyebrow">{{ t('workspace.recap.preview') }}</span>
              <div class="recap-head">
                <div class="recap-icon">
                  <AppIcon
                    :src="form.icon_url"
                    :alt="''"
                    fallback-icon="apps"
                  />
                </div>
                <div>
                  <h2>{{ form.name }}</h2>
                  <p class="text-muted">
                    {{ categoryName || t('publication.preview.noCategory') }} ·
                    {{
                      auth.user?.developer_profile?.public_name || auth.userName
                    }}
                  </p>
                  <HostingBadge :source-type="app.source_type" />
                </div>
              </div>
              <p v-if="form.short_description"
                ><strong>{{ form.short_description }}</strong></p
              >
              <p class="recap-description">{{
                form.description || t('publication.preview.noDescription')
              }}</p>
              <div
                v-if="retained.mobile.length || retained.tablet.length"
                class="recap-shots"
              >
                <img
                  v-for="url in [...retained.mobile, ...retained.tablet]"
                  :key="url"
                  :src="resolveMediaUrl(url)"
                  alt=""
                  loading="lazy"
                />
              </div>
              <dl class="recap-facts">
                <dt>{{ t('workspace.field.languages') }}</dt>
                <dd>{{
                  form.languages.map(languageName).join(', ') || '—'
                }}</dd>
                <dt>{{ t('workspace.recap.availability') }}</dt>
                <dd>{{
                  form.availability === 'selected'
                    ? t(
                        'workspace.recap.countries',
                        { n: form.countries.length },
                        form.countries.length
                      )
                    : t('workspace.recap.allCountries')
                }}</dd>
                <dt>{{ t('workspace.field.officialUrl') }}</dt>
                <dd>{{ form.official_site_url || '—' }}</dd>
                <dt>{{ t('workspace.field.contactEmail') }}</dt>
                <dd>{{ form.contact_email || '—' }}</dd>
                <dt>{{ t('workspace.field.dataCollected') }}</dt>
                <dd>{{
                  form.data_collected
                    .map(d => t(`workspace.data.${d}`))
                    .join(', ') || '—'
                }}</dd>
                <dt>{{ t('workspace.recap.source') }}</dt>
                <dd>{{
                  app.source_type === 'url'
                    ? app.external_url
                    : nextVersion
                      ? t('workspace.recap.version', {
                          number: nextVersion.version_number,
                          domains: nextVersion.detected_domains?.length || 0
                        })
                      : '—'
                }}</dd>
              </dl>
            </q-card>

            <q-card flat bordered class="workspace-card recap-checks">
              <h2>{{
                t(
                  readiness?.kind === 'update'
                    ? 'workspace.recap.updateTitle'
                    : 'workspace.recap.title'
                )
              }}</h2>
              <p class="text-muted">{{
                t(
                  readiness?.kind === 'update'
                    ? 'workspace.recap.updateIntro'
                    : 'workspace.recap.intro'
                )
              }}</p>
              <template
                v-if="readiness?.kind === 'update' && changedFields.length"
              >
                <h3>{{ t('workspace.recap.changes') }}</h3>
                <ul class="recap-changes">
                  <li v-for="field in changedFields" :key="field">{{
                    fieldLabel(field)
                  }}</li>
                </ul>
              </template>
              <h3>{{ t('workspace.recap.checks') }}</h3>
              <ul class="recap-list">
                <li v-for="gap in readiness?.gaps || []" :key="gap" class="gap">
                  <q-icon name="error_outline" color="orange-8" />
                  <span>{{ gap }}</span>
                </li>
                <li
                  v-for="gap in readiness?.blockers || []"
                  :key="gap"
                  class="gap"
                >
                  <q-icon name="badge" color="orange-8" />
                  <span>{{ gap }}</span>
                  <q-btn
                    flat
                    dense
                    no-caps
                    color="primary"
                    :label="t('publication.submission.completeProfile')"
                    to="/developer/profile"
                  />
                </li>
                <li v-if="readiness && !readiness.has_changes" class="gap">
                  <q-icon name="info" color="grey-7" />
                  <span>{{ t('workspace.recap.nothing') }}</span>
                </li>
                <!-- The API enforces this requirement; only admins can waive it. -->
                <li v-if="app.source_type === 'url'" class="gap">
                  <q-icon
                    :name="
                      app.sdk_check?.status === 'connected'
                        ? 'check_circle'
                        : 'insights'
                    "
                    :color="
                      app.sdk_check?.status === 'connected'
                        ? 'positive'
                        : 'grey-7'
                    "
                  />
                  <span>{{
                    app.sdk_check_required === false
                      ? ui('Contrôle du script facultatif pour cette application.')
                      : app.sdk_check
                        ? t(`sdk.check.status.${app.sdk_check.status}`)
                        : t('sdk.recapUnchecked')
                  }}</span>
                  <q-btn
                    v-if="app.sdk_check?.status !== 'connected'"
                    flat
                    dense
                    no-caps
                    color="primary"
                    :label="t('sdk.recapAction')"
                    @click="tab = 'version'"
                  />
                </li>
                <li v-if="readiness?.ready" class="ok">
                  <q-icon name="check_circle" color="positive" />
                  <span>{{ t('workspace.recap.allGood') }}</span>
                </li>
              </ul>
              <div class="gap-links">
                <q-btn
                  v-for="item in tabs.filter(x => tabGaps[x.name])"
                  :key="item.name"
                  flat
                  dense
                  no-caps
                  color="primary"
                  :icon="item.icon"
                  :label="
                    t('workspace.recap.complete', {
                      section: t(`workspace.tab.${item.name}`)
                    })
                  "
                  @click="tab = item.name"
                />
              </div>
              <q-btn
                v-if="!openRequest"
                class="submit-button"
                color="primary"
                unelevated
                no-caps
                size="lg"
                icon="send"
                :label="t('workspace.submit')"
                :disable="!readiness?.ready || busy"
                :loading="busy"
                @click="submit"
              />
              <p v-if="!openRequest" class="text-caption text-muted">{{
                t('workspace.recap.afterSubmit')
              }}</p>
              <p v-else class="text-muted">{{
                t(`workspace.banner.open.${openRequest.status}`, {
                  date: formatDate(openRequest.submitted_at)
                })
              }}</p>
            </q-card>
          </div>
        </q-tab-panel>

        <!-- 6. Suivi -->
        <q-tab-panel name="history">
          <section class="workspace-card history-card">
            <h3>{{ t('workspace.history.requests') }}</h3>
            <p v-if="!requests.length" class="text-muted">{{
              t('workspace.history.noRequest')
            }}</p>
            <q-list separator class="history-list">
              <q-item v-for="r in requests" :key="r.id">
                <q-item-section>
                  <q-item-label>
                    {{ t(`requests.kind.${r.kind}`) }}
                    <span v-if="r.version">
                      ·
                      {{
                        t('publication.versions.version', {
                          number: r.version.version_number
                        })
                      }}</span
                    >
                  </q-item-label>
                  <q-item-label caption>
                    {{
                      t('workspace.history.sent', {
                        date: formatDate(r.submitted_at)
                      })
                    }}
                    <span v-if="r.decided_at">
                      ·
                      {{
                        t('workspace.history.decided', {
                          date: formatDate(r.decided_at)
                        })
                      }}</span
                    >
                  </q-item-label>
                  <q-item-label v-if="r.reason" class="decision-reason">{{
                    r.reason
                  }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip
                    dense
                    :color="REQUEST_COLORS[r.status]"
                    text-color="white"
                    :label="t(`requests.status.${r.status}`)"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </section>
          <section class="workspace-card history-card">
            <h3>{{ t('publication.history.title') }}</h3>
            <q-list dense separator>
              <q-item v-for="event in events" :key="event.id">
                <q-item-section>
                  <q-item-label>{{ eventLabel(event.action) }}</q-item-label>
                  <q-item-label caption
                    >{{ formatDate(event.created_at) }} ·
                    {{
                      event.actor?.name || t('publication.history.automatic')
                    }}</q-item-label
                  >
                  <q-item-label v-if="event.reason" caption>{{
                    event.reason
                  }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </section>
        </q-tab-panel>
      </q-tab-panels>
    </template>
  </q-page>
</template>
<script setup>
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch
} from 'vue'
import { useRoute } from 'vue-router'
import { QBtn } from 'quasar'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { api } from '@/boot/axios'
import { accountApi, apiMessage } from '@/services/account'
import { catalogApi } from '@/services/catalog'
import { useAuthStore } from '@/stores/auth'
import { usePlatform } from '@/composables/usePlatform'
import { resolveMediaUrl } from '@/utils/media'
import { safeExternalUrl } from '@/utils/listing'
import { statusColor, statusLabel } from '@/utils/appStatus'
import AppIcon from '@/components/AppIcon.vue'
import HostingBadge from '@/components/HostingBadge.vue'
import BuildUploader from '@/components/BuildUploader.vue'
import CoverUploader from '@/components/CoverUploader.vue'
import InstallMeasure from '@/components/InstallMeasure.vue'
import AppContentPanel from '@/components/AppContentPanel.vue'
import CountrySelect from '@/components/CountrySelect.vue'
import ExternalResourcesReport from '@/components/ExternalResourcesReport.vue'

const route = useRoute(),
  q = useQuasar(),
  auth = useAuthStore(),
  { t, te, tm, rt, locale } = useI18n(),
  { platform } = usePlatform()

const COMPATIBILITY = ['mobile', 'tablet', 'desktop', 'offline', 'dark_mode']
const DATA_COLLECTED = [
  'none',
  'account',
  'contact',
  'location',
  'health',
  'payment',
  'photos',
  'analytics',
  'advertising'
]
const LANGUAGES = [
  'fr',
  'en',
  'ar',
  'es',
  'pt',
  'de',
  'it',
  'nl',
  'sw',
  'wo',
  'ha',
  'yo',
  'ln',
  'bm',
  'zh',
  'ru',
  'tr',
  'hi'
]
const EDITABLE = ['draft', 'changes_requested', 'rejected']
// Which section holds each field the server reports as missing.
const FIELD_TAB = {
  category_id: 'info',
  short_description: 'info',
  description: 'info',
  languages: 'info',
  official_site_url: 'info',
  contact_email: 'info',
  countries: 'info',
  icon_url: 'media',
  cover: 'media',
  media: 'media',
  contains_ads: 'content',
  content_rating: 'content',
  review_access: 'content',
  privacy_policy_url: 'privacy',
  privacy: 'privacy'
}
const VERSION_COLORS = {
  draft: 'grey-7',
  analysing: 'blue-grey-6',
  ready: 'blue-7',
  submitted: 'indigo-6',
  in_review: 'indigo-6',
  approved: 'teal-7',
  rejected: 'red-7',
  deployed: 'green-7'
}
const REQUEST_COLORS = {
  pending: 'blue-7',
  in_review: 'indigo-6',
  approved: 'green-7',
  changes_requested: 'orange-8',
  rejected: 'red-7',
  withdrawn: 'grey-7'
}
const tabs = [
  { name: 'info', icon: 'article' },
  { name: 'media', icon: 'photo_library' },
  { name: 'privacy', icon: 'privacy_tip' },
  { name: 'content', icon: 'policy' },
  { name: 'version', icon: 'upload_file' },
  { name: 'submit', icon: 'fact_check' },
  { name: 'history', icon: 'timeline' }
]

// Bottom of each form: one save button, and what saving means for a live app.
const SaveBar = defineComponent({
  props: { locked: Boolean, busy: Boolean, live: Boolean },
  setup(props) {
    return () =>
      h('div', { class: 'save-bar' }, [
        h(QBtn, {
          type: 'submit',
          color: 'primary',
          unelevated: true,
          noCaps: true,
          icon: 'save',
          label: t('workspace.save'),
          loading: props.busy,
          disable: props.locked
        }),
        h(
          'span',
          { class: 'text-caption text-muted' },
          props.locked
            ? t('workspace.banner.openLocked')
            : props.live
              ? t('workspace.saveLive')
              : t('workspace.saveDraft')
        )
      ])
  }
})

const app = ref(null),
  readiness = ref(null),
  requests = ref([]),
  events = ref([]),
  urlChecks = ref([]),
  categories = ref([]),
  loading = ref(true),
  busy = ref(false),
  error = ref('')
const tab = ref(route.query.tab || 'info')
const helpOpen = ref(false)
const form = reactive({
  name: '',
  short_description: '',
  description: '',
  category_id: null,
  subcategory: '',
  languages: [],
  countries: [],
  official_site_url: '',
  support_url: '',
  terms_url: '',
  contact_email: '',
  privacy_policy_url: '',
  data_collected: [],
  compatibility: [],
  icon_url: '',
  availability: 'all',
  cover: null
})
const coverBusy = ref(false),
  coverProgress = ref(0)
const source = reactive({ source_type: 'build', external_url: '' })
const retained = reactive({ mobile: [], tablet: [] })
const newScreens = reactive({ mobile: [], tablet: [] })
const iconFile = ref(null)
const previews = new Map()

const openRequest = computed(() => app.value?.open_request || null)
const lastDecision = computed(
  () => requests.value.find(r => r.status !== 'withdrawn') || null
)
const locked = computed(
  () => !!openRequest.value || app.value?.status === 'archived'
)
const liveListing = computed(() =>
  ['approved', 'published', 'suspended'].includes(app.value?.status)
)
const hasPendingChanges = computed(
  () =>
    !!app.value?.pending_changes &&
    Object.keys(app.value.pending_changes).length > 0
)
const changedFields = computed(() =>
  Object.keys(app.value?.pending_changes || {}).filter(f => f !== 'category')
)
// An app already in ZIP mode keeps it; otherwise ZIP depends on the platform switch.
const zipAllowed = computed(
  () => app.value?.source_type === 'build' || !!platform.value?.build_uploads
)
const sourceEditable = computed(
  () => EDITABLE.includes(app.value?.status) && !locked.value
)
const sourceDirty = computed(
  () =>
    source.source_type !== app.value?.source_type ||
    (source.source_type === 'url' &&
      source.external_url !== (app.value?.external_url || ''))
)
const categoryName = computed(
  () =>
    categories.value.find(c => c.id === form.category_id)?.name ||
    app.value?.category?.name
)
const nextVersion = computed(() =>
  (app.value?.versions || []).find(
    v =>
      ['passed', 'quarantined'].includes(v.scan_status) &&
      v.moderation_status === 'pending'
  )
)
const iconPreview = computed(() =>
  iconFile.value ? filePreview(iconFile.value) : ''
)
const languageOptions = computed(() =>
  LANGUAGES.map(code => ({ value: code, label: languageName(code) }))
)
const tabGaps = computed(() => {
  const counts = {}
  for (const field of readiness.value?.gap_fields || [])
    counts[FIELD_TAB[field]] = (counts[FIELD_TAB[field]] || 0) + 1
  if (readiness.value?.source_gaps?.length)
    counts.version = readiness.value.source_gaps.length
  return counts
})

function languageName(code) {
  try {
    const name = new Intl.DisplayNames([locale.value], { type: 'language' }).of(
      code
    )
    return name
      ? name.charAt(0).toLocaleUpperCase(locale.value) + name.slice(1)
      : code
  } catch {
    return code
  }
}
const formatDate = value =>
  value ? new Date(value).toLocaleString(locale.value) : ''
const fieldLabel = field => {
  const keys = {
    short_description: 'shortDescription',
    category_id: 'category',
    official_site_url: 'officialUrl',
    contact_email: 'contactEmail',
    support_url: 'supportUrl',
    terms_url: 'termsUrl',
    privacy_policy_url: 'privacyUrl',
    privacy: 'dataCollected',
    icon_url: 'icon',
    media: 'screenshots'
  }
  return t(`workspace.field.${keys[field] || field}`)
}
const eventLabel = action =>
  te(`workspace.event.${action}`)
    ? t(`workspace.event.${action}`)
    : statusLabel(action)

function versionState(v) {
  if (v.status === 'active') return 'deployed'
  if (v.moderation_status === 'approved') return 'approved'
  if (v.moderation_status === 'rejected') return 'rejected'
  if (openRequest.value?.app_version_id === v.id)
    return openRequest.value.status === 'in_review' ? 'in_review' : 'submitted'
  if (v.scan_status === 'pending') return 'analysing'
  if (['passed', 'quarantined'].includes(v.scan_status)) return 'ready'
  return 'draft'
}

function filePreview(file) {
  if (!previews.has(file)) previews.set(file, URL.createObjectURL(file))
  return previews.get(file)
}
onBeforeUnmount(() => previews.forEach(url => URL.revokeObjectURL(url)))

function fill() {
  // The form shows the listing as it will be once pending changes are approved.
  const l = { ...app.value, ...app.value.pending_changes }
  Object.assign(form, {
    name: l.name || '',
    short_description: l.short_description || '',
    description: l.description || '',
    category_id: l.category_id || null,
    subcategory: l.subcategory || '',
    languages: l.languages || [],
    countries: l.countries || [],
    official_site_url: l.official_site_url || '',
    support_url: l.support_url || '',
    terms_url: l.terms_url || '',
    contact_email: l.contact_email || '',
    privacy_policy_url: l.privacy_policy_url || '',
    data_collected: l.privacy?.data_collected || [],
    compatibility: Object.entries(l.compatibility || {})
      .filter(([, on]) => on && on !== '0')
      .map(([k]) => k),
    icon_url: l.icon_url || '',
    availability: l.availability || 'all',
    cover: l.cover || null
  })
  retained.mobile = [...(l.media?.screenshots?.mobile || [])]
  retained.tablet = [...(l.media?.screenshots?.tablet || [])]
  newScreens.mobile = []
  newScreens.tablet = []
  iconFile.value = null
  Object.assign(source, {
    source_type: app.value.source_type || 'build',
    external_url: app.value.external_url || ''
  })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const id = route.params.id
    app.value = (await api.get(`/apps/${id}`)).data
    fill()
    const [ready, reqs, evts] = await Promise.all([
      accountApi.readiness(id),
      accountApi.appRequests(id),
      accountApi.appEvents(id)
    ])
    readiness.value = ready.data
    requests.value = reqs.data.data
    events.value = evts.data.data
    urlChecks.value =
      app.value.source_type === 'url'
        ? (await accountApi.urlChecks(id)).data.data
        : []
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}

async function run(action, message) {
  busy.value = true
  error.value = ''
  try {
    await action()
    await load()
    if (message) q.notify({ type: 'positive', message })
    return true
  } catch (e) {
    error.value = apiMessage(e)
    q.notify({ type: 'negative', message: error.value })
    return false
  } finally {
    busy.value = false
  }
}

const savedMessage = () =>
  liveListing.value ? t('workspace.savedLive') : t('workspace.saved')
function put(fill) {
  const data = new FormData()
  data.append('_method', 'PUT')
  fill(data)
  return accountApi.updateApp(app.value.id, data)
}
const appendList = (data, key, list) =>
  list.length
    ? list.forEach((v, i) => data.append(`${key}[${i}]`, v))
    : data.append(key, '')

function saveInfo() {
  return run(
    () =>
      put(data => {
        for (const key of [
          'name',
          'short_description',
          'description',
          'subcategory',
          'official_site_url',
          'support_url',
          'terms_url',
          'contact_email'
        ])
          data.append(key, form[key] || '')
        if (form.category_id) data.append('category_id', form.category_id)
        appendList(data, 'languages', form.languages)
        data.append('availability', form.availability)
        appendList(
          data,
          'countries',
          form.availability === 'selected' ? form.countries : []
        )
        COMPATIBILITY.forEach(key =>
          data.append(
            `compatibility[${key}]`,
            form.compatibility.includes(key) ? 1 : 0
          )
        )
      }),
    savedMessage()
  )
}
function saveMedia() {
  return run(
    () =>
      put(data => {
        if (iconFile.value) data.append('icon', iconFile.value)
        for (const device of ['mobile', 'tablet']) {
          appendList(data, `retained_media[${device}]`, retained[device])
          newScreens[device].forEach(file =>
            data.append(`media[screenshots][${device}][]`, file)
          )
        }
      }),
    savedMessage()
  )
}
function savePrivacy() {
  return run(
    () =>
      put(data => {
        data.append('privacy_policy_url', form.privacy_policy_url || '')
        form.data_collected.forEach((v, i) =>
          data.append(`privacy[data_collected][${i}]`, v)
        )
      }),
    savedMessage()
  )
}
async function uploadCover(file) {
  coverBusy.value = true
  coverProgress.value = 0
  const data = new FormData()
  data.append('_method', 'PUT')
  data.append('cover', file)
  await run(
    () =>
      accountApi.updateApp(app.value.id, data, {
        onUploadProgress: e =>
          (coverProgress.value = e.total ? e.loaded / e.total : 0)
      }),
    savedMessage()
  )
  coverBusy.value = false
}
function removeCover() {
  return run(() => put(data => data.append('remove_cover', 1)), savedMessage())
}
function toggleData(item, checked) {
  // "No data" excludes every other choice, and the reverse.
  if (!checked)
    form.data_collected = form.data_collected.filter(x => x !== item)
  else
    form.data_collected =
      item === 'none'
        ? ['none']
        : [...form.data_collected.filter(x => x !== 'none'), item]
}
function addScreens(device, files) {
  newScreens[device].push(...(files || []))
}
function removeScreen(device, url) {
  retained[device] = retained[device].filter(x => x !== url)
}
function rejected() {
  q.notify({ type: 'negative', message: t('workspace.fileRejected') })
}
function saveSource() {
  return run(
    () =>
      accountApi.source(app.value.id, {
        source_type: source.source_type,
        external_url: source.source_type === 'url' ? source.external_url : null
      }),
    t('publication.source.saved')
  )
}
function checkUrl() {
  return run(
    () => accountApi.checkUrl(app.value.id),
    t('publication.source.checkOk')
  )
}
function submit() {
  q.dialog({
    title: t('workspace.confirmSubmit.title'),
    message: t('workspace.confirmSubmit.message'),
    cancel: true,
    ok: { label: t('workspace.submit'), color: 'primary', noCaps: true }
  }).onOk(async () => {
    if (
      await run(
        () => accountApi.submitApp(app.value.id),
        t('workspace.submitted')
      )
    )
      tab.value = 'history'
  })
}
function withdraw() {
  q.dialog({
    title: t('workspace.confirmWithdraw.title'),
    message: t('workspace.confirmWithdraw.message'),
    cancel: true
  }).onOk(() =>
    run(() => accountApi.withdrawApp(app.value.id), t('workspace.withdrawn'))
  )
}
function discard() {
  q.dialog({
    title: t('workspace.confirmDiscard.title'),
    message: t('workspace.confirmDiscard.message'),
    cancel: true
  }).onOk(() =>
    run(() => accountApi.discardChanges(app.value.id), t('workspace.discarded'))
  )
}
function publish() {
  return run(
    () => accountApi.publishApp(app.value.id),
    t('publication.submission.published')
  )
}
function deploy(v) {
  q.dialog({
    title: t('publication.versions.deployTitle'),
    message: t('publication.versions.deployMessage'),
    cancel: true
  }).onOk(() =>
    run(() => accountApi.deploy(v.id), t('publication.versions.deployed'))
  )
}
function archive() {
  q.dialog({
    title: t('publication.submission.archiveTitle'),
    message: t('publication.submission.archiveMessage'),
    cancel: true
  }).onOk(() =>
    run(
      () => accountApi.archiveApp(app.value.id),
      t('publication.submission.archived')
    )
  )
}
function restore() {
  return run(
    () => accountApi.restoreApp(app.value.id),
    t('publication.submission.restored')
  )
}

watch(
  () => route.params.id,
  id => id && load()
)
watch(tab, value =>
  history.replaceState(history.state, '', `${location.pathname}?tab=${value}`)
)
onMounted(async () => {
  load()
  try {
    categories.value = (await catalogApi.categories()).data
  } catch {
    // Categories only feed the select; the saved one still shows by name.
  }
})
</script>
<style scoped>
.app-heading {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.app-heading-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  overflow: hidden;
  flex: 0 0 auto;
  background: var(--surface-high);
}
.app-heading-text {
  flex: 1;
  min-width: 200px;
}
.app-heading-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.state-banner {
  border-radius: 14px;
  margin-bottom: 12px;
}
.state-banner p {
  margin: 2px 0 0;
}
.state-info {
  background: rgba(7, 91, 255, 0.08);
}
.state-warning {
  background: rgba(255, 148, 22, 0.14);
}
.state-success {
  background: rgba(22, 163, 74, 0.12);
}
.decision-reason {
  white-space: pre-line;
  font-weight: 500;
}
.workspace-panels {
  background: transparent;
}
.section-form {
  max-width: 760px;
}
.plain-fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 14px;
}
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}
.field-note {
  margin: -8px 0 0;
}
.checkbox-fieldset {
  border: 1px solid var(--outline);
  border-radius: 12px;
  padding: 8px 14px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
}
.checkbox-fieldset legend {
  padding: 0 6px;
  font-weight: 600;
}
.checkbox-fieldset p {
  width: 100%;
  margin: 0;
}
:deep(.save-bar) {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.icon-row {
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
}
.icon-preview {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  overflow: hidden;
  background: var(--surface-high);
}
.screens {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 4px 0 8px;
}
.screen-item {
  position: relative;
  margin: 0;
  flex: 0 0 auto;
}
.screen-item img {
  height: 180px;
  border-radius: 12px;
  border: 1px solid var(--outline);
  display: block;
}
.screen-new img {
  outline: 2px dashed var(--q-primary);
}
.screen-remove {
  position: absolute;
  top: 6px;
  right: 6px;
}
.source-explain {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 13px;
  margin: 6px 0 10px;
}
.version-source,
.version-url,
.version-build {
  max-width: 820px;
  margin-bottom: 20px;
}
.url-line {
  display: flex;
  gap: 6px;
  align-items: center;
  overflow-wrap: anywhere;
}
.version-card {
  margin-top: 10px;
}
.version-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.version-head h4 {
  margin: 0;
  font-size: 16px;
}
.analysis-list {
  margin: 4px 0 8px;
  padding-left: 18px;
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}
.recap-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
@media (max-width: 900px) {
  .recap-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
.recap-head {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 8px 0;
}
.recap-head h2 {
  margin: 0;
  font-size: 22px;
}
.recap-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  overflow: hidden;
  flex: 0 0 auto;
  background: var(--surface-high);
}
.recap-description {
  white-space: pre-line;
}
.recap-shots {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.recap-shots img {
  height: 160px;
  border-radius: 10px;
  border: 1px solid var(--outline);
}
.recap-facts {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 4px 12px;
  margin: 12px 0 0;
  font-size: 14px;
}
.recap-facts dt {
  color: var(--muted);
}
.recap-facts dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.recap-list {
  list-style: none;
  padding: 0;
  margin: 0 0 8px;
  display: grid;
  gap: 8px;
}
.recap-list li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.recap-changes {
  margin: 0 0 8px;
  padding-left: 18px;
}
.gap-links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
}
.submit-button {
  width: 100%;
}
.history-card {
  margin-bottom: 16px;
}
.history-card :deep(.q-item) {
  padding: 10px 4px;
}
.help-card {
  width: min(640px, 100vw);
}
.help-title {
  margin: 0;
  font-size: 20px;
  font-weight: 750;
}
.help-body {
  max-height: 65vh;
  overflow-y: auto;
}
.help-step {
  margin-bottom: 12px;
}
.help-step p {
  margin: 2px 0 0;
}
</style>
