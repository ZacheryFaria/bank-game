pipeline {
    agent any

    environment {
        BRANCH_TAG = env.BRANCH_NAME.replace('/', '__').replace('-', '_').toLowerCase()
        BUILD_TAG = "${env.BRANCH_TAG}_${env.GIT_COMMIT.substring(0, 8)}_${env.BUILD_NUMBER}"
        DOCKER_IMAGE = "bank-game-ci:${BUILD_TAG}"
    }

    stages {
        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE} ."
                }
            }

            post {
                success {
                    publishChecks name: 'Build Docker Image',
                        summary: 'Docker image built successfully',
                        conclusion: 'SUCCESS',
                        detailsURL: "${env.BUILD_URL}console"
                }
                failure {
                    publishChecks name: 'Build Docker Image',
                        summary: 'Failed to build Docker image',
                        conclusion: 'FAILURE',
                        detailsURL: "${env.BUILD_URL}console"
                }
            }
        }

        stage('Backend Type Check') {
            steps {
                script {
                    sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd backend && pnpm type-check'"
                }
            }

            post {
                success {
                    publishChecks name: 'Backend Type Check',
                        summary: 'Backend TypeScript type checking passed',
                        conclusion: 'SUCCESS',
                        detailsURL: "${env.BUILD_URL}console"
                }
                failure {
                    publishChecks name: 'Backend Type Check',
                        summary: 'Backend TypeScript type checking failed',
                        conclusion: 'FAILURE',
                        detailsURL: "${env.BUILD_URL}console"
                }
            }
        }

        stage('TUI Type Check') {
            steps {
                script {
                    sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd tui && pnpm type-check'"
                }
            }

            post {
                success {
                    publishChecks name: 'TUI Type Check',
                        summary: 'TUI TypeScript type checking passed',
                        conclusion: 'SUCCESS',
                        detailsURL: "${env.BUILD_URL}console"
                }
                failure {
                    publishChecks name: 'TUI Type Check',
                        summary: 'TUI TypeScript type checking failed',
                        conclusion: 'FAILURE',
                        detailsURL: "${env.BUILD_URL}console"
                }
            }
        }

        stage('Backend Build') {
            steps {
                script {
                    sh """
                        docker run --rm -v \$(pwd)/artifacts:/artifacts ${DOCKER_IMAGE} sh -c '
                            cd backend &&
                            pnpm build &&
                            mkdir -p /artifacts/backend &&
                            cp -r dist /artifacts/backend/
                        '
                    """
                }
            }

            post {
                always {
                    archiveArtifacts artifacts: 'artifacts/backend/**/*', allowEmptyArchive: true, fingerprint: true
                    sh "docker run --rm -v \$(pwd)/artifacts:/artifacts ${DOCKER_IMAGE} rm -rf /artifacts/backend"
                }
                success {
                    publishChecks name: 'Backend Build',
                        summary: 'Backend built successfully',
                        conclusion: 'SUCCESS',
                        detailsURL: "${env.BUILD_URL}console"
                }
                failure {
                    publishChecks name: 'Backend Build',
                        summary: 'Backend build failed',
                        conclusion: 'FAILURE',
                        detailsURL: "${env.BUILD_URL}console"
                }
            }
        }

        stage('TUI Build') {
            steps {
                script {
                    sh """
                        docker run --rm -v \$(pwd)/artifacts:/artifacts ${DOCKER_IMAGE} sh -c '
                            cd tui &&
                            pnpm build &&
                            mkdir -p /artifacts/tui &&
                            cp -r dist /artifacts/tui/
                        '
                    """
                }
            }

            post {
                always {
                    archiveArtifacts artifacts: 'artifacts/tui/**/*', allowEmptyArchive: true, fingerprint: true
                    sh "docker run --rm -v \$(pwd)/artifacts:/artifacts ${DOCKER_IMAGE} rm -rf /artifacts/tui"
                }
                success {
                    publishChecks name: 'TUI Build',
                        summary: 'TUI built successfully',
                        conclusion: 'SUCCESS',
                        detailsURL: "${env.BUILD_URL}console"
                }
                failure {
                    publishChecks name: 'TUI Build',
                        summary: 'TUI build failed',
                        conclusion: 'FAILURE',
                        detailsURL: "${env.BUILD_URL}console"
                }
            }
        }

        stage('Backend Lint') {
            steps {
                script {
                    sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd backend && pnpm lint' || true"
                }
            }

            post {
                always {
                    publishChecks name: 'Backend Lint',
                        summary: 'Backend linting completed (warnings allowed)',
                        conclusion: 'NEUTRAL',
                        detailsURL: "${env.BUILD_URL}console"
                }
            }
        }

        stage('TUI Lint') {
            steps {
                script {
                    sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd tui && pnpm lint' || true"
                }
            }

            post {
                always {
                    publishChecks name: 'TUI Lint',
                        summary: 'TUI linting completed (warnings allowed)',
                        conclusion: 'NEUTRAL',
                        detailsURL: "${env.BUILD_URL}console"
                }
            }
        }

        stage('TUI Tests') {
            when {
                expression {
                    return sh(
                        script: "docker run --rm ${DOCKER_IMAGE} sh -c 'cd tui && find src -name \"*.test.tsx\" 2>/dev/null | wc -l'",
                        returnStdout: true
                    ).trim().toInteger() > 0
                }
            }
            steps {
                script {
                    sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd tui && pnpm test'"
                }
            }

            post {
                success {
                    publishChecks name: 'TUI Tests',
                        summary: 'TUI tests passed',
                        conclusion: 'SUCCESS',
                        detailsURL: "${env.BUILD_URL}console"
                }
                failure {
                    publishChecks name: 'TUI Tests',
                        summary: 'TUI tests failed',
                        conclusion: 'FAILURE',
                        detailsURL: "${env.BUILD_URL}console"
                }
            }
        }

        stage('Cleanup Docker Image') {
            steps {
                script {
                    sh "docker rmi ${DOCKER_IMAGE} || true"
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
