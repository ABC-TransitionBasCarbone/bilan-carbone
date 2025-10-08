import { prismaClient } from '@/db/client'
import { getOrganizationVersionById, getOrganizationWithSitesById } from '@/db/organization'
import { getStudyById } from '@/db/study'
import { Command } from 'commander'
import * as readline from 'readline'

const program = new Command()

program
  .name('move-studies-of-organization')
  .description('Script to switch study from one orga to another')
  .version('1.0.0')
  .requiredOption('-oo, --old-orga-version-id <value>', 'old organization link to the study')
  .requiredOption('-no, --new-orga-version-id <value>', 'new organization link to the study')
  .requiredOption('-s, --study-id <value>', 'Id of the study')
  .option(
    '-so',
    '--new-organization-id-for-study',
    'id of the new organization for the study if new orga version is CR',
  )
  .parse(process.argv)

const params = program.opts()

const switchStudiesOfOrganization = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const userConfirmation = await new Promise((resolve) => {
    rl.question('Do you have the authorization from the orga that own the study ?', (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })

  if (!userConfirmation) {
    console.log('❌ switch cancelled.')
    return
  }

  const { oldOrgaVersionId, newOrgaVersionId, studyId, newOrganizationIdForStudy } = params

  const oldOrgaVersion = await getOrganizationVersionById(oldOrgaVersionId)
  const newOrgaVersion = await getOrganizationVersionById(newOrgaVersionId)
  const study = await getStudyById(studyId, null)

  if (!oldOrgaVersion || !newOrgaVersion || !study) {
    console.log('❌ One of the organization does not exist.')
    return
  }

  if (newOrgaVersion.organization.isCR && !newOrganizationIdForStudy) {
    console.log('❌ The new organization is a CR orga. Please provide the id of the new organization for the study.')
    return
  }

  let newOrganizationVersionForStudy
  let newOrganizationForStudyName
  if (newOrgaVersion.organization.isCR) {
    const newOrganizationForStudy = await getOrganizationWithSitesById(newOrganizationIdForStudy)

    if (!newOrganizationForStudy) {
      console.log('❌ The new organization for the study does not exist.')
      return
    }

    const newOrganizationVersionForStudyId = newOrganizationForStudy.organizationVersions.find(
      (orgaV) => orgaV.environment === newOrgaVersion.environment,
    )?.id

    if (!newOrganizationVersionForStudyId) {
      console.log(
        `❌ The new organization for the study does not have an organization version in the same environment as the new orga version (${newOrgaVersion.environment}).`,
      )
      return
    }

    newOrganizationVersionForStudy = await getOrganizationVersionById(newOrganizationVersionForStudyId)

    if (!newOrganizationVersionForStudy) {
      console.log('❌ The new organization version for the study does not exist.')
      return
    }

    newOrganizationForStudyName = newOrganizationForStudy.name
  } else {
    newOrganizationVersionForStudy = newOrgaVersion
    newOrganizationForStudyName = newOrgaVersion.organization.name
  }

  const userConfirmationOfOrgas = await new Promise((resolve) => {
    rl.question(
      `You do want to move the study from orga ${oldOrgaVersion.organization.name} to ${newOrgaVersion.organization.name} ${newOrgaVersion.organization.isCR ? `, CR orga, the study will be put to this orga: ${newOrganizationForStudyName} included in the CR orga` : ''} ? `,
      (answer) => {
        rl.close()
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
      },
    )
  })

  if (!userConfirmationOfOrgas) {
    console.log('❌ switch cancelled.')
    return
  }

  const usersFromNewOrga = study.allowedUsers.filter((user) => user.account.organizationVersionId === newOrgaVersionId)
  if (usersFromNewOrga.length === 0) {
    console.log('❌ No user from the new orga have access to the study. Please add at least one user.')
    return
  }

  if (!usersFromNewOrga.some((user) => !!user.account.user.level)) {
    console.log('❌ No user added to the study has a level of formation in the new orga. Please add at least one user.')
  }

  const studySites = study.sites.map((site) => site.site.name)
  const newOrgaSites = newOrganizationVersionForStudy.organization.sites.map((site) => site.name)
  const missingSites = studySites.filter((site) => !newOrgaSites.includes(site))

  if (missingSites.length > 0) {
    console.log(
      `❌ The new organization does not have the same sites as the study. Missing sites: ${missingSites.join(', ')}`,
    )
    return
  }

  await prismaClient.study.update({
    where: { id: studyId },
    data: { organizationVersionId: newOrgaVersionId },
  })

  await Promise.all(
    study.sites.map((studySite) => {
      const newSite = newOrganizationVersionForStudy.organization.sites.find(
        (site) => site.name === studySite.site.name,
      )

      if (!newSite) {
        console.log(`❌ Site ${studySite.site.name} not found in the new organization.`)
        return Promise.resolve()
      }

      return prismaClient.studySite.update({
        where: { id: studySite.id },
        data: { siteId: newSite.id },
      })
    }),
  )
}

switchStudiesOfOrganization()
