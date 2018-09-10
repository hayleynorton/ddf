package org.codice.ddf.catalog.ui.query.monitor.email;

import static org.terracotta.modules.ehcache.ToolkitInstanceFactoryImpl.LOGGER;

import ddf.catalog.CatalogFramework;
import ddf.catalog.data.Metacard;
import ddf.catalog.data.Result;
import ddf.catalog.federation.FederationException;
import ddf.catalog.filter.FilterBuilder;
import ddf.catalog.operation.Query;
import ddf.catalog.operation.QueryRequest;
import ddf.catalog.operation.QueryResponse;
import ddf.catalog.operation.impl.QueryImpl;
import ddf.catalog.operation.impl.QueryRequestImpl;
import ddf.catalog.plugin.PluginExecutionException;
import ddf.catalog.plugin.PostFederatedQueryPlugin;
import ddf.catalog.plugin.PostQueryPlugin;
import ddf.catalog.plugin.StopProcessingException;
import ddf.catalog.source.SourceUnavailableException;
import ddf.catalog.source.UnsupportedQueryException;
import ddf.security.SubjectIdentity;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.apache.shiro.SecurityUtils;
import org.codice.ddf.catalog.ui.metacard.workspace.WorkspaceMetacardImpl;
import org.opengis.filter.Filter;

public class SubscribedWorkspaceNotifier implements PostQueryPlugin, PostFederatedQueryPlugin {

  private static SubjectIdentity subjectIdentity;

  private static EmailNotifier emailNotifierService;

  private static FilterBuilder filterBuilder;

  private static CatalogFramework catalogFramework;

  private static final String WORKSPACE_TAG = "workspace";

  private static final String QUERIES_ATTRIBUTE = "queries";

  @SuppressWarnings("unused")
  public void setSubjectIdentity(SubjectIdentity subjectIdentity) {
    this.subjectIdentity = subjectIdentity;
  }

  @SuppressWarnings("unused")
  public void setEmailNotifierService(EmailNotifier emailNotifierService) {
    this.emailNotifierService = emailNotifierService;
  }

  @SuppressWarnings("unused")
  public void setFilterBuilder(FilterBuilder filterBuilder) {
    this.filterBuilder = filterBuilder;
  }

  @SuppressWarnings("unused")
  public void setCatalogFramework(CatalogFramework catalogFramework) {
    this.catalogFramework = catalogFramework;
  }

  @Override
  public QueryResponse process(QueryResponse queryResponse)
      throws PluginExecutionException, StopProcessingException {
    if (queryResponse == null) {
      throw new PluginExecutionException("Cannot process null queryResponse");
    }
    // if (!queryResponse.getResults().isEmpty()) {
    String queryId = (String) queryResponse.getRequest().getProperties().get("id");
    Metacard metacard = getWorkspaceMetacard(queryId);
    WorkspaceMetacardImpl workspaceMetacard = WorkspaceMetacardImpl.from(metacard);
    if (WorkspaceMetacardImpl.isWorkspaceMetacard(workspaceMetacard)) {
      String userEmail = subjectIdentity.getUniqueIdentifier(SecurityUtils.getSubject());
      String ownerEmail = workspaceMetacard.getOwner();
      if (ownerEmail.equals(userEmail)) {
        emailNotifierService.sendEmailsForWorkspace(workspaceMetacard, 1L);
      }
    }
    // }
    return queryResponse;
  }

  private Metacard getWorkspaceMetacard(String queryId) {
    Filter filter = filterBuilder.allOf(getWorkspaceQueryFilters(queryId));

    Query query = new QueryImpl(filter);
    QueryRequest queryRequest = new QueryRequestImpl(query);

    Metacard workspaceMetacard = null;
    try {
      QueryResponse queryResponse = catalogFramework.query(queryRequest);
      workspaceMetacard =
          queryResponse
              .getResults()
              .stream()
              .map(Result::getMetacard)
              .filter(Objects::nonNull)
              .findFirst()
              .orElse(null);

    } catch (UnsupportedQueryException | SourceUnavailableException | FederationException e) {
      LOGGER.debug("Error querying for query id: {}.", queryId, e);
    }
    return workspaceMetacard;
  }

  private List<Filter> getWorkspaceQueryFilters(String queryId) {
    List<Filter> filters = new ArrayList<>();
    filters.add(filterBuilder.attribute(Metacard.TAGS).is().text(WORKSPACE_TAG));
    filters.add(filterBuilder.attribute(QUERIES_ATTRIBUTE).like().text(queryId));
    return filters;
  }
}
