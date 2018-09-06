package org.codice.ddf.catalog.ui.query.monitor.email;

import ddf.catalog.data.Metacard;
import ddf.catalog.operation.QueryResponse;
import ddf.catalog.plugin.PluginExecutionException;
import ddf.catalog.plugin.PostFederatedQueryPlugin;
import ddf.catalog.plugin.PostQueryPlugin;
import ddf.catalog.plugin.StopProcessingException;
import ddf.security.SubjectIdentity;
import org.apache.shiro.SecurityUtils;
import org.codice.ddf.catalog.ui.metacard.workspace.WorkspaceMetacardImpl;
import org.codice.ddf.catalog.ui.util.EndpointUtil;

public class SubscribedWorkspaceNotifier implements PostQueryPlugin, PostFederatedQueryPlugin {

  private static EndpointUtil endpointUtil;

  private static SubjectIdentity subjectIdentity;

  private static EmailNotifier emailNotifierService;

  @SuppressWarnings("unused")
  public void setEndpointUtil(EndpointUtil endpointUtil) {
    this.endpointUtil = endpointUtil;
  }

  @SuppressWarnings("unused")
  public void setSubjectIdentity(SubjectIdentity subjectIdentity) {
    this.subjectIdentity = subjectIdentity;
  }

  @SuppressWarnings("unused")
  public void setEmailNotifierService(EmailNotifier emailNotifierService) {
    this.emailNotifierService = emailNotifierService;
  }

  @Override
  public QueryResponse process(QueryResponse queryResponse)
      throws PluginExecutionException, StopProcessingException {
    if (queryResponse == null) {
      throw new PluginExecutionException("Cannot process null queryResponse");
    }
    if (!queryResponse.getResults().isEmpty()) {
      // how to get workspace id?
      Metacard metacard = endpointUtil.findWorkspace("some_workspace_id");
      WorkspaceMetacardImpl workspaceMetacard = WorkspaceMetacardImpl.from(metacard);
      if (WorkspaceMetacardImpl.isWorkspaceMetacard(workspaceMetacard)) {
        String userEmail = subjectIdentity.getUniqueIdentifier(SecurityUtils.getSubject());
        String ownerEmail = workspaceMetacard.getOwner();
        if (ownerEmail.equals(userEmail)) {
          emailNotifierService.sendEmailsForWorkspace(workspaceMetacard, 1L);
        }
      }
    }
    return queryResponse;
  }
}
