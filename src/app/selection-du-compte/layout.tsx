import ChecklistButton from '@/components/checklist/ChecklistButton'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import Navbar from '@/components/navbar/Navbar'
import { getAccountOrganizationVersions } from '@/db/account'
import { OrganizationVersionWithOrganization } from '@/db/organization'
import { getAllowedStudyIdByAccount } from '@/db/study'
import EnvironmentInitializer from '@/environments/core/EnvironmentInitializer'
import Footer from '@/environments/cut/layout/footer'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import styles from './layout.module.css'

interface Props {
    children: React.ReactNode
}

const SelectionLayout = async ({ children, user: account }: Props & UserSessionProps) => {
    const [organizationVersions, studyId] = await Promise.all([
        getAccountOrganizationVersions(account.accountId),
        getAllowedStudyIdByAccount(account),
    ])

    const accountOrganizationVersion = organizationVersions.find(
        (organizationVersion) => organizationVersion.id === account.organizationVersionId,
    ) as OrganizationVersionWithOrganization
    const clientId = organizationVersions.find(
        (organizationVersion) => organizationVersion.id !== account.organizationVersionId,
    )?.id

    return (
        <div>
            <Navbar user={account} />
            <main className={classNames(styles.content, { [styles.withOrganizationCard]: account.organizationVersionId })}>
                {children}
            </main>
            {accountOrganizationVersion && (
                <ChecklistButton
                    accountOrganizationVersion={accountOrganizationVersion}
                    clientId={clientId}
                    studyId={studyId}
                    userRole={account.role}
                />
            )}
            <EnvironmentInitializer user={account} />
        </div>
    )
}

export default withAuth(SelectionLayout)
